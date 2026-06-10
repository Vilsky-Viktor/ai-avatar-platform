from dotenv import load_dotenv
load_dotenv()

import json
import os
import signal

from google.cloud import pubsub_v1

from loom24_shared import logger, set_log_context, clear_log_context
from loom24_shared.services import send_job
from loom24_shared.types import CropperStep, Job, JobMetadata, JobStatuses, StepBase

from services.job_service import get_job
from controllers.crop import crop_to_path
from utils.detector import warmup as warmup_pose

PROJECT_ID              = os.environ["PROJECT_ID"]
SUBSCRIPTION_ID         = os.getenv("SUBSCRIPTION_ID", "cropper-sub")
WORKFLOW_MANAGER_TOPIC  = os.getenv("WORKFLOW_MANAGER_TOPIC", "workflow-manager")
MAX_CONCURRENT_MESSAGES = int(os.getenv("MAX_CONCURRENT_MESSAGES", "10"))
SERVICE_NAME            = os.getenv("SERVICE_NAME", "cropper")

subscriber = pubsub_v1.SubscriberClient()


def _callback(message: pubsub_v1.subscriber.message.Message) -> None:
    try:
        raw = json.loads(message.data.decode())
    except Exception as error:
        logger.error(f"Failed to parse message: {error}")
        message.ack()
        return

    try:
        job = Job.model_validate(raw)
    except Exception as error:
        logger.error(f"Failed to validate job payload: {error}")
        message.ack()
        return

    set_log_context(user_id=job.userId, avatar_id=job.avatarId, job_id=job.id)

    logger.info("Received message")

    try:
        db_job = get_job(job)
        if db_job.status == JobStatuses.canceled:
            logger.info("Job is canceled — skipping")
            message.ack()
            return
    except Exception as error:
        if getattr(getattr(error, "response", None), "status_code", None) == 404:
            logger.info("Job not found — skipping")
            message.ack()
            return
        logger.error(f"Failed to fetch from job manager: {error}", exc_info=True)
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

    step = CropperStep.model_validate(job.workflow[step_idx].model_dump())

    logger.info(f"Starting crop — mediaPath={step.mediaPath} mode={step.mode} uploadPath={step.uploadPath}")

    try:
        if not step.uploadPath:
            raise ValueError("Missing uploadPath in workflow step")

        width, height = crop_to_path(step.mediaPath, step.uploadPath, mode=step.mode.value)

        step.status = JobStatuses.completed
        step.error = None

        existing_metadata = job.metadata.model_dump() if job.metadata else {}
        job.metadata = JobMetadata(**{**existing_metadata, "ratio": "1:1", "dimensions": f"{width}x{height}"})
    except Exception as error:
        logger.error(f"Crop failed: {error}", exc_info=True)
        step.status = JobStatuses.error
        step.error = str(error)
    finally:
        job.workflow[step_idx] = StepBase.model_validate(step.model_dump(mode="json"))
        send_job(WORKFLOW_MANAGER_TOPIC, job, SERVICE_NAME)
        message.ack()
        clear_log_context()


def main() -> None:
    logger.info("Warming up YOLO pose model...")
    warmup_pose()
    logger.info("Model ready. Starting subscriber...")

    subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
    flow_control      = pubsub_v1.types.FlowControl(max_messages=MAX_CONCURRENT_MESSAGES)

    streaming_pull = subscriber.subscribe(
        subscription_path,
        callback=_callback,
        flow_control=flow_control,
    )

    logger.info(f"[{SERVICE_NAME}] Listening on {subscription_path}")

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
