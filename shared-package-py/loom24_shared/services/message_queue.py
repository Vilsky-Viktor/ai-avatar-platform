import json
import os
from google.cloud import pubsub_v1
from ..logger import logger
from ..types.job import Job

_publisher: pubsub_v1.PublisherClient | None = None

def _get_publisher() -> pubsub_v1.PublisherClient:
    global _publisher
    if _publisher is None:
        _publisher = pubsub_v1.PublisherClient()
    return _publisher

_MAX_RETRIES = 3

def send_job(topic_name: str, job: Job, service_name: str) -> None:
    project_id = os.environ["PROJECT_ID"]
    topic_path = _get_publisher().topic_path(project_id, topic_name)
    data = json.dumps(job.model_dump(mode="json")).encode()

    last_error: Exception | None = None
    for attempt in range(_MAX_RETRIES):
        try:
            future = _get_publisher().publish(topic_path, data, service=service_name)
            message_id = future.result()
            logger.info(f"Message {message_id} published. Job: {job.id}")
            return
        except Exception as e:
            last_error = e
            logger.warning(f"Publish attempt {attempt + 1}/{_MAX_RETRIES} failed for job {job.id}: {e}")

    logger.error(f"Failed to publish job {job.id} after {_MAX_RETRIES} attempts: {last_error}")
    raise last_error
