import json
import os
import threading
import time

from google.cloud import pubsub_v1

import train_videox_fun.logger as log
from train_videox_fun.logger import set_job_id, clear_job_id
import train_videox_fun.db as db
import train_videox_fun.message_queue as mq
import train_videox_fun.storage as storage
import train_videox_fun.training as training
from train_videox_fun.models import Job

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
        job: Job | None = None
        semaphore_acquired = False

        try:
            if not semaphore.acquire(blocking=False):
                logger.info("Semaphore busy — nacking for redelivery")
                message.nack()
                return
            semaphore_acquired = True
            job_start = time.monotonic()

            try:
                job = Job.model_validate(json.loads(message.data.decode("utf-8"))["job"])
            except Exception as parse_err:
                logger.error(f"Failed to parse job message — acking to discard: {parse_err}")
                message.ack()
                return

            set_job_id(job.id)
            training_cfg = job.input.training
            logger.info(f"Received training job: avatar={job.avatarId}, model={training_cfg.modelName}")

            if not training_cfg.toolkit:
                logger.error("toolkit config is empty — stale or malformed job, discarding")
                message.ack()
                return

            db_job = db.get_job_by_id(job.id)
            if db_job is None or db_job.get("status") == "cancelled":
                logger.info("Job cancelled or not found — skipping")
                message.ack()
                return

            media_paths = training_cfg.mediaPaths
            prompts = training_cfg.prompts

            if not media_paths:
                _publish_error(job, "No mediaPaths provided")
                message.ack()
                return

            if len(prompts) != len(media_paths):
                err = f"prompts length ({len(prompts)}) != mediaPaths length ({len(media_paths)})"
                _publish_error(job, err)
                message.ack()
                return

            logger.info(f"Downloading model {training_cfg.modelName} ...")
            storage.download_model(training_cfg.modelName)

            logger.info(f"Downloading {len(media_paths)} training images ...")
            raw = storage.download_images(media_paths)

            pairs = [(img, prompt) for img, prompt in zip(raw, prompts) if img is not None]
            if not pairs:
                _publish_error(job, "No images could be downloaded")
                message.ack()
                return

            images, aligned_prompts = zip(*pairs)
            images = list(images)
            aligned_prompts = list(aligned_prompts)
            logger.info(f"Downloaded {len(images)}/{len(media_paths)} images successfully")

            process_cfg = training_cfg.toolkit["config"]["process"][0]
            rank = process_cfg["network"]["linear"]
            lr = process_cfg["train"]["lr"]
            resolution = process_cfg["datasets"][0]["resolution"][0]
            dest_prefix = (
                f"media/{job.userId}-user/avatars/{job.avatarId}-avatar"
                f"/loras/wan22-t2v-a14b-{lr}-{rank}-{resolution}"
            )

            job.status = "generating"
            mq.publish_status(job.model_dump())

            # Ack early — training takes many hours
            message.ack()

            out_dir = storage.make_lora_output_dir(job.id)
            dataset_dir = storage.make_dataset_dir(job.id)

            try:
                _, meta_path = storage.write_dataset(images, aligned_prompts, dataset_dir)
                lora_paths = training.run_training(
                    model_name=training_cfg.modelName,
                    dataset_dir=dataset_dir,
                    meta_path=meta_path,
                    output_dir=out_dir,
                    toolkit=training_cfg.toolkit,
                )
            except Exception as e:
                logger.error(f"Training failed after {_fmt_elapsed(job_start)}: {e}", exc_info=True)
                storage.cleanup_lora_output_dir(job.id)
                storage.cleanup_dataset_dir(job.id)
                _publish_error(job, str(e))
                return
            finally:
                storage.cleanup_dataset_dir(job.id)

            logger.info(f"Uploading LoRA checkpoints to {dest_prefix}/ ...")
            try:
                for boundary, lora_path in lora_paths.items():
                    dest_blob = f"{dest_prefix}/{boundary}_noise_lora.safetensors"
                    storage.upload_lora(lora_path, dest_blob)
                logger.info(f"Uploaded {len(lora_paths)} LoRA(s) → {dest_prefix}/")
            except Exception as e:
                logger.error(f"Upload failed after {_fmt_elapsed(job_start)}: {e}", exc_info=True)
                _publish_error(job, str(e))
                return
            finally:
                storage.cleanup_lora_output_dir(job.id)

            job.status = "completed"
            job.result.mediaPath = dest_prefix
            mq.publish_status(job.model_dump())
            logger.info(f"Job completed in {_fmt_elapsed(job_start)} — LoRAs at {dest_prefix}/")

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
            clear_job_id()

    return process_job


def run_worker():
    logger.info("Starting train-videox-fun worker")

    semaphore = threading.Semaphore(1)
    subscriber = mq.get_subscriber_client()
    sub_path = subscriber.subscription_path(mq.PROJECT_ID, mq.SUBSCRIPTION_ID)

    logger.info(f"Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=make_process_job(semaphore),
            flow_control=pubsub_v1.types.FlowControl(max_messages=1),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received.")
            streaming_pull.cancel()


def main():
    logger.info("Starting train-videox-fun service")
    run_worker()


if __name__ == "__main__":
    main()
