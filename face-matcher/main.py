from dotenv import load_dotenv
load_dotenv()

import json
import logging
import os
import signal
import sys

from google.cloud import pubsub_v1

from matcher import get_app, acquire_face_recognition, ADAFACE_MODEL_DIR
from storage import download_bytes, download_models

PROJECT_ID              = os.environ["PROJECT_ID"]
SUBSCRIPTION_ID         = os.getenv("SUBSCRIPTION_ID", "face-matcher-sub")
WORKFLOW_MANAGER_TOPIC  = os.getenv("WORKFLOW_MANAGER_TOPIC", "workflow-manager")
POOL_SIZE               = int(os.getenv("POOL_SIZE", "1"))
MAX_CONCURRENT_MESSAGES = int(os.getenv("MAX_CONCURRENT_MESSAGES", str(POOL_SIZE)))

SERVICE_NAME = "face-matcher"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

publisher  = pubsub_v1.PublisherClient()
subscriber = pubsub_v1.SubscriberClient()


def _send_job(job: dict) -> None:
    topic_path = publisher.topic_path(PROJECT_ID, WORKFLOW_MANAGER_TOPIC)
    publisher.publish(topic_path, json.dumps(job).encode()).result()
    logger.info(f"Published job {job.get('id')} to {WORKFLOW_MANAGER_TOPIC}")


def _callback(message: pubsub_v1.subscriber.message.Message) -> None:
    try:
        job = json.loads(message.data.decode())
    except Exception as e:
        logger.error(f"Failed to parse message: {e}")
        message.nack()
        return

    job_id = job.get("id", "unknown")

    step_idx = next(
        (i for i, step in enumerate(job.get("workflow", []))
         if step.get("service") == SERVICE_NAME and step.get("status") == "pending"),
        -1,
    )

    if step_idx < 0:
        logger.warning(f"No pending {SERVICE_NAME} step in job {job_id}")
        message.ack()
        return

    step = job["workflow"][step_idx]

    try:
        image_bytes       = download_bytes(step["imagePath"])
        id_photo_bytes    = [download_bytes(p) for p in step["idPhotoPaths"]]

        with acquire_face_recognition() as fr:
            similarity = fr.calc_face_similarity(id_photo_bytes, image_bytes)

        if similarity is None:
            raise ValueError(f"No face detected in image: {step['imagePath']}")

        similarity = round(float(similarity), 4)

        if similarity >= step["threshold"]:
            logger.info(f"Job {job_id}: face match passed (similarity={similarity}, threshold={step['threshold']})")
            step["status"] = "completed"
        else:
            logger.info(f"Job {job_id}: face match FAILED (similarity={similarity}, threshold={step['threshold']})")
            step["status"] = "error"
            step["error"]  = f"face similarity {similarity:.4f} below threshold {step['threshold']}"

    except Exception as e:
        logger.error(f"Job {job_id}: face matcher error: {e}", exc_info=True)
        step["status"] = "error"
        step["error"]  = str(e)
    finally:
        message.ack()

    job["workflow"][step_idx] = step
    _send_job(job)


def main() -> None:
    logger.info(f"Downloading models to {ADAFACE_MODEL_DIR}...")
    download_models(ADAFACE_MODEL_DIR)

    logger.info(f"Loading face recognition model (pool_size={POOL_SIZE})...")
    get_app(n=POOL_SIZE)
    logger.info("Face recognition model loaded. Starting subscriber...")

    subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
    flow_control      = pubsub_v1.types.FlowControl(max_messages=MAX_CONCURRENT_MESSAGES)

    streaming_pull = subscriber.subscribe(
        subscription_path,
        callback=_callback,
        flow_control=flow_control,
    )

    logger.info(f"Listening on {subscription_path}")

    def _shutdown(sig, _frame):
        logger.info("Shutting down...")
        streaming_pull.cancel()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    try:
        streaming_pull.result()
    except Exception:
        streaming_pull.cancel()
        streaming_pull.result()


if __name__ == "__main__":
    main()
