import json
import multiprocessing
import os
import threading

from google.cloud import pubsub_v1

import train_lora_qwen_edit_2511.logger as log
from train_lora_qwen_edit_2511.logger import set_job_id, clear_job_id
import train_lora_qwen_edit_2511.db as db
import train_lora_qwen_edit_2511.message_queue as mq
import train_lora_qwen_edit_2511.storage as storage
import train_lora_qwen_edit_2511.training as training
from train_lora_qwen_edit_2511.models import Job

logger = log.get_logger(__name__)

MESSAGE_CONCURRENCY = int(os.environ.get("MESSAGE_CONCURRENCY", "1"))
MODEL_NAME = os.environ.get("MODEL_NAME", "qwen-edit-2511")
DIFFUSERS_ATTN_BACKEND = os.environ.get("DIFFUSERS_ATTN_BACKEND", "native")

ATTN_BACKEND_NAMES = {
    "flash": "Flash Attention 2",
    "_flash_3": "Flash Attention 3",
    "native": "PyTorch SDPA",
    "sage": "SageAttention",
    "_sage_qk_int8_pv_fp8_cuda_sm90": "SageAttention INT8/FP8 SM90",
}


def _publish_error(job: Job, message: str):
    job.status = "error"
    job.result.errorMessage = message
    try:
        mq.publish_status(job.model_dump())
    except Exception as e:
        logger.error(f"Failed to publish error status: {e}", exc_info=True)


def make_process_job(shared: training.SharedComponents, semaphore: threading.Semaphore):
    def process_job(message: pubsub_v1.subscriber.message.Message):
        job: Job | None = None

        try:
            try:
                job = Job.model_validate(json.loads(message.data.decode("utf-8"))["job"])
            except Exception as parse_err:
                logger.error(f"Failed to parse job message — acking to discard: {parse_err}")
                message.ack()
                return

            set_job_id(job.id)
            training_cfg = job.input.training
            logger.info(f"Received training job: avatar={job.avatarId}, steps={training_cfg.numSteps}")

            if not training_cfg.numSteps:
                logger.error("numSteps is 0 — stale or malformed job, discarding")
                message.ack()
                return

            # Check if job was cancelled
            db_job = db.get_job_by_id(job.id)
            if db_job is None or db_job.get("status") == "cancelled":
                logger.info("Job cancelled or not found — skipping")
                message.ack()
                return

            media_paths = training_cfg.mediaPaths
            prompts = training_cfg.prompts

            if not media_paths:
                _publish_error(job, "No mediaPaths provided in job input")
                logger.error("No mediaPaths provided in job input")
                message.ack()
                return

            if len(prompts) != len(media_paths):
                err = f"prompts length ({len(prompts)}) != mediaPaths length ({len(media_paths)})"
                _publish_error(job, err)
                logger.error(err)
                message.ack()
                return

            logger.info(f"Downloading {len(media_paths)} training images ...")
            raw = storage.download_images(media_paths)

            # Keep only successfully downloaded images, preserving prompt alignment
            pairs = [(img, prompt) for img, prompt in zip(raw, prompts) if img is not None]
            if not pairs:
                _publish_error(job, "No images could be downloaded")
                logger.error("No images could be downloaded — acking with error")
                message.ack()
                return

            images, aligned_prompts = zip(*pairs)
            images = list(images)
            aligned_prompts = list(aligned_prompts)
            logger.info(f"Downloaded {len(images)}/{len(media_paths)} images successfully")

            # Ack early — training takes 30-60 min; holding the lease that long risks redelivery
            message.ack()

            job.status = "generating"
            mq.publish_status(job.model_dump())

            dest = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/loras/{job.result.fileName}"
            out_dir = storage.make_lora_output_dir(job.id)

            with semaphore:
                try:
                    training.train_lora(
                        images=images,
                        prompts=aligned_prompts,
                        config=training_cfg,
                        out_dir=out_dir,
                        shared=shared,
                    )
                except Exception as e:
                    logger.error(f"Training failed: {e}", exc_info=True)
                    storage.cleanup_lora_output_dir(job.id)
                    _publish_error(job, str(e))
                    return

                logger.info(f"Uploading LoRA to gs://{dest} ...")
                try:
                    storage.upload_lora(out_dir, dest)
                except Exception as e:
                    logger.error(f"Upload failed: {e}", exc_info=True)
                    _publish_error(job, str(e))
                    return
                finally:
                    storage.cleanup_lora_output_dir(job.id)

            job.status = "completed"
            job.result.mediaPath = dest
            mq.publish_status(job.model_dump())
            logger.info(f"Job completed — LoRA at {dest}")

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
            clear_job_id()

    return process_job


def run_worker(worker_idx: int):
    logger.info(f"[worker {worker_idx}] Starting")

    try:
        shared = training.load_shared_components()
    except Exception as e:
        logger.error(f"[worker {worker_idx}] Failed to load shared components: {e}", exc_info=True)
        raise

    semaphore = threading.Semaphore(1)
    subscriber = mq.get_subscriber_client()
    sub_path = subscriber.subscription_path(mq.PROJECT_ID, mq.SUBSCRIPTION_ID)

    logger.info(f"[worker {worker_idx}] Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=make_process_job(shared, semaphore),
            flow_control=pubsub_v1.types.FlowControl(max_messages=1),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info(f"[worker {worker_idx}] Shutdown signal received.")
            streaming_pull.cancel()


def main():
    logger.info(f"Starting train-lora-qwen-edit-2511 (concurrency={MESSAGE_CONCURRENCY})")
    logger.info(f"Attention backend: {ATTN_BACKEND_NAMES.get(DIFFUSERS_ATTN_BACKEND, DIFFUSERS_ATTN_BACKEND)}")

    try:
        storage.download_model(MODEL_NAME)
    except Exception as e:
        logger.error(f"Failed to download model: {e}", exc_info=True)
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
