import json
import multiprocessing
import os
import threading
import time

from google.cloud import pubsub_v1

import gen_wan_22_mimic_motion.logger as log
from gen_wan_22_mimic_motion.logger import set_job_id, unset_job_id
import gen_wan_22_mimic_motion.db as db
import gen_wan_22_mimic_motion.message_queue as mq
import gen_wan_22_mimic_motion.storage as storage
from gen_wan_22_mimic_motion.models import Job
from gen_wan_22_mimic_motion import inference

logger = log.get_logger(__name__)

MESSAGE_CONCURRENCY = int(os.environ.get("MESSAGE_CONCURRENCY", "1"))

def _fmt_elapsed(start: float) -> str:
    total = int(time.monotonic() - start)
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _publish_error(job: Job, message: str):
    job.status = "error"
    job.result.errorMessage = message
    try:
        mq.publish_status(job.model_dump())
    except Exception as e:
        logger.error(f"Failed to publish error status: {e}", exc_info=True)

def make_process_job(semaphore: threading.Semaphore):
    def process_job(message: pubsub_v1.subscriber.message.Message):
        job = None
        semaphore_acquired = False

        try:
            if not semaphore.acquire(blocking=False):
                logger.info("Semaphore busy — nacking for redelivery")
                message.nack()
                return
            semaphore_acquired = True
            job_start = time.monotonic()

            job = Job.model_validate(json.loads(message.data.decode("utf-8"))["job"])
            job_input = job.input
            media_path = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/images/{job.result.fileName}"

            set_job_id(job.id)
            logger.info(f"Received gen video job: avatar={job.avatarId}")

            db_job = db.get_job_by_id(job.id)
            if db_job is None or db_job.get("status") == "cancelled":
                logger.info("Job cancelled or not found — skipping")
                message.ack()
                return
            
            logger.info("Loading dependency images ...")
            reference_videos = storage.load_input_videos(job_input.inference.mediaPaths)

            if job_input.checkDependencies:
                if len(reference_videos) != len(job_input.inference.mediaPaths):
                    logger.warning(f"Missing reference videos, skipping job {job.id}")
                    message.nack()
                    return

            job.status = "generating"
            mq.publish_status(job.model_dump())

            if job_input.loras:
                for lora in job_input.loras:
                    storage.ensure_lora_downloaded(lora.path)

            # Ack early — generation takes many minutes; holding the lease risks redelivery
            message.ack()

            tmp_path = storage.LOCAL_TMP_DIR / f"{job.id}-{job.result.fileName}"
            try:
                inference.run_inference(job, str(tmp_path))
                storage.upload_result_video(media_path, str(tmp_path))
            finally:
                tmp_path.unlink(missing_ok=True)

            job.status = "completed"
            job.result.mediaPath = media_path

            mq.publish_status(job.model_dump())
            logger.info(f"Job completed in {_fmt_elapsed(job_start)}")
        except Exception as e:
            logger.error(f"Unexpected error processing job: {e}", exc_info=True)
            if job is not None:
                _publish_error(job, str(e))
                try:
                    message.ack()
                except Exception:
                    pass
            else:
                message.nack()
        finally:
            if semaphore_acquired:
                semaphore.release()
            unset_job_id()

    return process_job


def run_worker(worker_idx: int):
    logger.info(f"[worker {worker_idx}] Starting")

    semaphore = threading.Semaphore(1)
    subscriber = mq.get_subscriber_client()
    sub_path = subscriber.subscription_path(mq.PROJECT_ID, mq.SUBSCRIPTION_ID)

    logger.info(f"[worker {worker_idx}] Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=make_process_job(semaphore),
            flow_control=pubsub_v1.types.FlowControl(max_messages=1),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info(f"[worker {worker_idx}] Shutdown signal received.")
            streaming_pull.cancel()

def main():
    logger.info(f"Starting gen-wan-22-mimic-motion service (concurrency={MESSAGE_CONCURRENCY})")

    try:
        storage.sync_models()
    except Exception as e:
        logger.error(f"Failed to sync models folder on startup: {e}", exc_info=True)
        raise

    if MESSAGE_CONCURRENCY == 1:
        run_worker(0)
    else:
        multiprocessing.set_start_method("spawn")
        processes = [
            multiprocessing.Process(target=run_worker, args=(i,), daemon=False)
            for i in range(MESSAGE_CONCURRENCY)
        ]
        for p in processes:
            p.start()
        try:
            for p in processes:
                p.join()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received, terminating workers.")
            for p in processes:
                p.terminate()
            for p in processes:
                p.join()

if __name__ == "__main__":
    main()