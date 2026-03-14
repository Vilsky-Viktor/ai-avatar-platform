import os
import json
from google.cloud import pubsub_v1
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
RESULT_TOPIC_ID = os.getenv("RESULT_TOPIC_ID", "ai-model-result")
JOB_TOPIC_ID = os.getenv("JOB_TOPIC_ID", "generate-text-image-to-image")

publisher = pubsub_v1.PublisherClient()
result_topic_path = publisher.topic_path(PROJECT_ID, RESULT_TOPIC_ID)
job_topic_path = publisher.topic_path(PROJECT_ID, JOB_TOPIC_ID)

def publish_status(result_payload):
    try:
        data = json.dumps(result_payload).encode("utf-8")
        future = publisher.publish(result_topic_path, data=data)
        logger.debug(f"Result/update published: {future.result()}")
    except Exception as error:
        logger.error(f"Failed to publish result to Pub/Sub: {error}")

def get_subscriber_client():
    return pubsub_v1.SubscriberClient()

def resend_job(job_payload):
    try:
        data = json.dumps(job_payload).encode("utf-8")
        future = publisher.publish(job_topic_path, data=data)
        logger.debug(f"Job has been resent: {future.result()}")
    except Exception as error:
        logger.error(f"Failed to resent job to Pub/Sub: {error}")