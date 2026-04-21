import json
import os
from concurrent.futures import ThreadPoolExecutor

from google.cloud.pubsub_v1.subscriber.message import Message

from .db             import get_job_by_id
from .logger         import logger, set_job_id, clear_job_id
from .message_queue  import get_subscriber_client, publish_status, SUBSCRIPTION_ID, PROJECT_ID
from .models         import Job
from .runpod         import reset_inactivity_timer, stop_inactivity_timer
from .storage        import download_images, download_model, upload_lora, make_lora_output_dir, cleanup_lora_output_dir
from .training       import train_lora

MESSAGE_CONCURRENCY = int(os.environ.get("MESSAGE_CONCURRENCY", "1"))


def _publish_error(job: Job, message: str):
    job.status = "error"
    job.result.errorMessage = message
    try:
        publish_status(job.model_dump())
    except Exception as e:
        logger.error(f"Failed to publish error status: {e}", exc_info=True)


def process_job(message: Message):
    job: Job | None = None

    try:
        job = Job.model_validate(json.loads(message.data.decode("utf-8"))["job"])
        set_job_id(job.id)
        stop_inactivity_timer()

        inference = job.input.inference
        logger.info(f"Received training job: avatar={job.avatarId}, steps={inference.numSteps}")

        # Check if job was cancelled
        db_job = get_job_by_id(job.id)
        if db_job is None or db_job.get("status") == "cancelled":
            logger.info("Job cancelled or not found — skipping")
            message.ack()
            return

        media_paths = inference.mediaPaths
        prompts     = inference.prompts

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
        raw = download_images(media_paths)

        # Keep only successfully downloaded images, preserving prompt alignment
        pairs = [(img, prompt) for img, prompt in zip(raw, prompts) if img is not None]
        if not pairs:
            _publish_error(job, "No images could be downloaded")
            logger.error("No images could be downloaded — acking with error")
            message.ack()
            return

        images, aligned_prompts = zip(*pairs)
        images          = list(images)
        aligned_prompts = list(aligned_prompts)
        logger.info(f"Downloaded {len(images)}/{len(media_paths)} images successfully")

        # Train
        dest    = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/loras/{job.result.fileName}"
        out_dir = make_lora_output_dir(job.id)
        try:
            train_lora(
                images=images,
                prompts=aligned_prompts,
                config=inference,
                out_dir=out_dir,
                num_buckets=job.metadata.numBuckets,
            )
        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            cleanup_lora_output_dir(job.id)
            _publish_error(job, str(e))
            message.ack()
            return

        # Upload LoRA to GCS
        logger.info(f"Uploading LoRA to gs://{dest} ...")
        try:
            upload_lora(out_dir, dest)
        except Exception as e:
            logger.error(f"Upload failed: {e}", exc_info=True)
            _publish_error(job, str(e))
            message.ack()
            return
        finally:
            cleanup_lora_output_dir(job.id)

        job.status = "completed"
        job.result.mediaPath = dest
        publish_status(job.model_dump())
        message.ack()
        logger.info(f"Job completed — LoRA at {dest}")

    except Exception as e:
        logger.error(f"Unexpected error processing job: {e}", exc_info=True)
        if job is not None:
            _publish_error(job, str(e))
            message.ack()
        else:
            message.nack()
    finally:
        clear_job_id()
        reset_inactivity_timer()


def main():
    logger.info(f"Starting train-lora-qwen-edit-2511 (concurrency={MESSAGE_CONCURRENCY})")

    try:
        download_model("qwen-edit-2511")
    except Exception as e:
        logger.error(f"Failed to download model: {e}", exc_info=True)
        raise

    reset_inactivity_timer()

    subscriber = get_subscriber_client()
    subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

    flow_control = subscriber.types.FlowControl(max_messages=MESSAGE_CONCURRENCY)

    executor = ThreadPoolExecutor(max_workers=MESSAGE_CONCURRENCY)

    def callback(message: Message):
        executor.submit(process_job, message)

    streaming_pull = subscriber.subscribe(
        subscription_path,
        callback=callback,
        flow_control=flow_control,
    )

    logger.info(f"Listening on {subscription_path} ...")
    try:
        streaming_pull.result()
    except Exception as e:
        logger.error(f"Streaming pull error: {e}", exc_info=True)
        streaming_pull.cancel()
        streaming_pull.result()


if __name__ == "__main__":
    main()
