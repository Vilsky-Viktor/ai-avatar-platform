import json
import multiprocessing
import os
import threading

from google.cloud import pubsub_v1

import ai_toolkit.logger as log
from ai_toolkit.logger import set_job_id, clear_job_id
import ai_toolkit.db as db
import ai_toolkit.message_queue as mq
import ai_toolkit.storage as storage
import ai_toolkit.training as training
from ai_toolkit.models import Job

logger = log.get_logger(__name__)

MESSAGE_CONCURRENCY = int(os.environ.get("MESSAGE_CONCURRENCY", "1"))


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

        try:
            try:
                job = Job.model_validate(json.loads(message.data.decode("utf-8"))["job"])
            except Exception as parse_err:
                logger.error(f"Failed to parse job message — acking to discard: {parse_err}")
                message.ack()
                return

            set_job_id(job.id)
            training_cfg = job.input.training
            logger.info(f"Received training job: avatar={job.avatarId}")

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

            logger.info(f"Downloading model {training_cfg.modelName} ...")
            storage.download_model(training_cfg.modelName)

            logger.info(f"Downloading {len(media_paths)} training images ...")
            raw = storage.download_images(media_paths)

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

            # Ack early — training takes many minutes; holding the lease risks redelivery
            message.ack()

            job.status = "generating"
            mq.publish_status(job.model_dump())

            process_cfg = training_cfg.toolkit["config"]["process"][0]
            lr = process_cfg["train"]["lr"]
            lora_rank = process_cfg["network"]["linear"]
            resolution = process_cfg["datasets"][0]["resolution"][0]
            arch = process_cfg["model"]["arch"]
            folder_name = f"{arch}-{lr}-{lora_rank}-{resolution}"
            dest_prefix = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/loras/{folder_name}"
            out_dir = storage.make_lora_output_dir(job.id)
            dataset_dir = storage.make_dataset_dir(job.id)

            with semaphore:
                try:
                    images_dir, control_dir = storage.write_dataset(images, aligned_prompts, dataset_dir, resolution)
                    training.run_training(training_cfg.toolkit, job.id, out_dir, images_dir, control_dir, training_cfg.modelName)
                except Exception as e:
                    logger.error(f"Training failed: {e}", exc_info=True)
                    storage.cleanup_lora_output_dir(job.id)
                    storage.cleanup_dataset_dir(job.id)
                    _publish_error(job, str(e))
                    return
                finally:
                    storage.cleanup_dataset_dir(job.id)

                logger.info(f"Uploading LoRA checkpoints to gs://{dest_prefix}/ ...")
                try:
                    n = storage.upload_lora_checkpoints(out_dir, dest_prefix)
                    logger.info(f"{n} checkpoint(s) uploaded → gs://{dest_prefix}/")
                except Exception as e:
                    logger.error(f"Upload failed: {e}", exc_info=True)
                    _publish_error(job, str(e))
                    return
                finally:
                    storage.cleanup_lora_output_dir(job.id)

            job.status = "completed"
            job.result.mediaPath = dest_prefix
            mq.publish_status(job.model_dump())
            logger.info(f"Job completed — LoRA checkpoints at {dest_prefix}")

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
    logger.info(f"Starting ai-toolkit service (concurrency={MESSAGE_CONCURRENCY})")

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
