from dotenv import load_dotenv
load_dotenv()

import json
import os
import signal

from google.cloud import pubsub_v1

from loom24_shared import logger, set_log_context, clear_log_context
from loom24_shared.types import FaceMatcherStep, Job, JobStatuses

from utils.matcher import get_app, acquire_face_recognition, ADAFACE_MODEL_DIR
from services.storage import download_bytes, download_models
from services.job_manager_service import get_job

PROJECT_ID              = os.environ["PROJECT_ID"]
SUBSCRIPTION_ID         = os.getenv("SUBSCRIPTION_ID", "face-matcher-sub")
WORKFLOW_MANAGER_TOPIC  = os.getenv("WORKFLOW_MANAGER_TOPIC", "workflow-manager")
POOL_SIZE               = int(os.getenv("POOL_SIZE", "1"))
MAX_CONCURRENT_MESSAGES = int(os.getenv("MAX_CONCURRENT_MESSAGES", str(POOL_SIZE)))

SERVICE_NAME = "face-matcher"

publisher  = pubsub_v1.PublisherClient()
subscriber = pubsub_v1.SubscriberClient()


def _send_job(job: Job) -> None:
    topic_path = publisher.topic_path(PROJECT_ID, WORKFLOW_MANAGER_TOPIC)
    publisher.publish(topic_path, json.dumps(job.model_dump(mode="json")).encode()).result()
    logger.info(f"Published to {WORKFLOW_MANAGER_TOPIC}")


def _callback(message: pubsub_v1.subscriber.message.Message) -> None:
    try:
        raw = json.loads(message.data.decode())
    except Exception as e:
        logger.error(f"Failed to parse message: {e}")
        message.nack()
        return

    try:
        job = Job.model_validate(raw)
    except Exception as e:
        logger.error(f"Failed to validate job payload: {e}")
        message.nack()
        return

    set_log_context(user_id=job.userId, avatar_id=job.avatarId, job_id=job.id)

    try:
        try:
            db_job = get_job(job)
            if db_job.status == JobStatuses.canceled:
                logger.info("Job is canceled — skipping")
                message.ack()
                return
        except Exception as e:
            if getattr(getattr(e, "response", None), "status_code", None) == 404:
                logger.info("Job not found — skipping")
                message.ack()
                return
            logger.error(f"Failed to fetch from job manager: {e}", exc_info=True)
            message.nack()
            return

        step_idx = next(
            (i for i, step in enumerate(job.workflow)
             if step.service == SERVICE_NAME
             and step.status == JobStatuses.pending),
            -1,
        )

        if step_idx < 0:
            logger.warning(f"No pending {SERVICE_NAME} step found")
            message.ack()
            return

        step = FaceMatcherStep.model_validate(job.workflow[step_idx].model_dump())

        try:
            image_bytes    = download_bytes(step.imagePath)
            id_photo_bytes = [download_bytes(p) for p in step.idPhotoPaths]

            with acquire_face_recognition() as fr:
                similarity = fr.calc_face_similarity(id_photo_bytes, image_bytes)

            if similarity is None:
                raise ValueError(f"No face detected in image: {step.imagePath}")

            similarity  = round(float(similarity), 4)
            face_match  = max(step.faceMatch or 0.0, similarity)
            step.faceMatch = face_match

            if job.curRun < job.maxRuns:
                if face_match >= step.threshold:
                    logger.info(f"Face match passed (faceMatch={face_match}, threshold={step.threshold})")
                    step.status = JobStatuses.completed
                    step.error  = None
                else:
                    logger.info(f"Face match FAILED (faceMatch={face_match}, threshold={step.threshold}, run={job.curRun}/{job.maxRuns})")
                    step.status = JobStatuses.error
                    step.error  = f"face similarity {face_match:.4f} below threshold {step.threshold}"
            else:
                logger.info(f"Final run — passing regardless (faceMatch={face_match}, threshold={step.threshold})")
                step.status = JobStatuses.completed
                step.error  = None

        except Exception as e:
            logger.error(f"Face matcher error: {e}", exc_info=True)
            step.status = JobStatuses.error
            step.error  = str(e)

        job.workflow[step_idx] = step
        _send_job(job)
        message.ack()
    finally:
        clear_log_context()


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
