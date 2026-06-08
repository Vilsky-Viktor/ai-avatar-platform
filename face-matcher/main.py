from dotenv import load_dotenv
load_dotenv()

import json
import os
import signal
from concurrent.futures import ThreadPoolExecutor

from google.cloud import pubsub_v1

from loom24_shared import logger, set_log_context, clear_log_context
from loom24_shared.types import FaceMatcherStep, Job, JobStatuses, StepBase

from utils.matcher import get_app, acquire_face_recognition
from services.storage import download_bytes, rename_blob, delete_blob
from services.job_manager_service import get_job

PROJECT_ID              = os.environ["PROJECT_ID"]
SUBSCRIPTION_ID         = os.getenv("SUBSCRIPTION_ID", "face-matcher-sub")
WORKFLOW_MANAGER_TOPIC  = os.getenv("WORKFLOW_MANAGER_TOPIC", "workflow-manager")
POOL_SIZE               = int(os.getenv("POOL_SIZE", "1"))
MAX_CONCURRENT_MESSAGES = int(os.getenv("MAX_CONCURRENT_MESSAGES", str(POOL_SIZE)))

SERVICE_NAME = os.getenv("SERVICE_NAME", "face-matcher")


def _prev_tmp_path(image_path: str) -> str:
    dot = image_path.rfind('.')
    if dot >= 0:
        return f"{image_path[:dot]}-prev-tmp{image_path[dot:]}"
    return f"{image_path}-prev-tmp"

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
        message.ack()
        return

    try:
        job = Job.model_validate(raw)
    except Exception as e:
        logger.error(f"Failed to validate job payload: {e}")
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

    logger.info(f"Starting face match — image={step.imagePath}, threshold={step.threshold}, run={job.curRun}/{job.maxRuns}")

    try:
        image_bytes    = download_bytes(step.imagePath)
        with ThreadPoolExecutor() as executor:
            id_photo_bytes = list(executor.map(download_bytes, step.idPhotoPaths))

        with acquire_face_recognition() as fr:
            similarity = fr.calc_face_similarity(id_photo_bytes, image_bytes)

        if similarity is None:
            raise ValueError(f"No face detected in image: {step.imagePath}")

        similarity      = round(float(similarity), 4)
        prev_face_match = step.faceMatch or 0.0
        is_better       = similarity > prev_face_match
        is_final        = job.curRun == job.maxRuns
        prev_tmp        = _prev_tmp_path(step.imagePath)

        logger.info(f"Similarity={similarity}, prev={prev_face_match}, is_better={is_better}, is_final={is_final}")

        if is_final:
            if is_better:
                step.faceMatch = similarity
            elif job.curRun > 1:
                logger.info(f"Current image worse — restoring best from {prev_tmp}")
                rename_blob(prev_tmp, step.imagePath)
        else:
            step.faceMatch = max(prev_face_match, similarity)
            if job.curRun == 1 or is_better:
                logger.info(f"Saving current as best candidate → {prev_tmp}")
                rename_blob(step.imagePath, prev_tmp)

        face_match    = step.faceMatch or 0.0
        threshold_met = face_match >= step.threshold

        if threshold_met:
            logger.info(f"Face match passed — faceMatch={face_match}, threshold={step.threshold}")
            step.status = JobStatuses.completed
            step.error  = None
        elif is_final:
            logger.info(f"Final run — completing regardless — faceMatch={face_match}, threshold={step.threshold}")
            step.status = JobStatuses.completed
            step.error  = None
        else:
            logger.info(f"Face match below threshold — retrying — faceMatch={face_match}, threshold={step.threshold}, run={job.curRun}/{job.maxRuns}")
            step.status = JobStatuses.error
            step.error  = f"face similarity {face_match:.4f} below threshold {step.threshold}"

        if step.status == JobStatuses.completed and job.maxRuns > 1:
            try:
                delete_blob(prev_tmp)
            except Exception:
                pass

    except Exception as e:
        logger.error(f"Face matcher error: {e}", exc_info=True)
        step.status = JobStatuses.error
        step.error  = str(e)
    finally:
        job.workflow[step_idx] = StepBase.model_validate(step.model_dump(mode="json"))
        _send_job(job)

        message.ack()
        clear_log_context()


def main() -> None:
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
