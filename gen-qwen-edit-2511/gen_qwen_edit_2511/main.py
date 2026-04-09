import os
import json

from google.cloud import pubsub_v1

import gen_qwen_edit_2511.logger as log
import gen_qwen_edit_2511.storage as storage
import gen_qwen_edit_2511.message_queue as mq
import gen_qwen_edit_2511.face_recognition as face_recognition
import gen_qwen_edit_2511.utils as utils
import gen_qwen_edit_2511.db as db
from gen_qwen_edit_2511.models import Job

import gen_qwen_edit_2511.inference as inference

logger = log.get_logger(__name__)

PROJECT_ID      = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "gen-qwen-edit-2511-sub")
MODEL_NAME      = os.getenv("MODEL_NAME", "qwen-edit-2511")
DIFFUSERS_ATTN_BACKEND = os.getenv("DIFFUSERS_ATTN_BACKEND", "native")

ATTN_BACKEND_NAMES = {
    "flash": "Flash Attention 2",
    "_flash_3": "Flash Attention 3",
    "native": "PyTorch SDPA",
    "sage": "SageAttention",
    "_sage_qk_int8_pv_fp8_cuda_sm90": "SageAttention INT8/FP8 SM90"
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def job_canceled(job_id: str) -> bool:
    db_job = db.get_job_by_id(job_id)
    if not db_job or db_job["status"] == "canceled":
        logger.info(f"Job {job_id} was removed or canceled")
        return True
    return False

# ---------------------------------------------------------------------------
# Main job processor — runs on Pub/Sub callback thread
# ---------------------------------------------------------------------------

@utils.timeit
def process_job(message: pubsub_v1.subscriber.message.Message):
    job = Job.model_validate(json.loads(message.data.decode("utf-8")))
    job_input = job.input
    loras_loaded = False

    logger.info(f"========= Processing job {job.id}, order {job.order or 'none'} =========")

    if job_canceled(job.id):
        message.ack()
        return

    try:
        logger.info("Loading dependency images ...")
        reference_images = storage.load_input_images(job_input.inference.mediaPaths)
        id_photos = storage.load_input_images(job_input.faceRecognition.mediaPaths) if job_input.faceRecognition.enabled else []

        if job_input.checkDependencies:
            if len(reference_images) != len(job_input.inference.mediaPaths):
                logger.warning(f"Missing reference images, skipping job {job.id}")
                message.nack()
                return
            if job_input.faceRecognition.enabled and len(id_photos) != len(job_input.faceRecognition.mediaPaths):
                logger.warning(f"Missing ID photos, skipping job {job.id}")
                message.nack()
                return

        job.status = "generating"
        mq.publish_status(job.model_dump())

        if job_input.loras:
            for lora in job_input.loras:
                storage.ensure_lora_downloaded(lora.path)
            try:
                inference.load_loras(job_input.loras)
                loras_loaded = True
            except Exception as lora_error:
                logger.error(f"Failed to load LoRAs: {lora_error}", exc_info=True)
                inference.unload_loras()
                raise

        if job_input.faceExpression.enabled:
            logger.info(f"Expression mode: '{job_input.faceExpression.type}' scale={job_input.faceExpression.scale}")

        max_runs = job.maxRuns if job_input.faceRecognition.enabled else 1
        best_img = None
        best_match = 0.0

        for run_idx in range(max_runs):
            logger.info(f"---------- Run #{run_idx + 1}/{max_runs} ----------")

            img, _ = inference.run_inference(job_input, reference_images)

            if job_input.faceRecognition.enabled:
                face_match = face_recognition.check_face_match(img, id_photos)
                job.result.faceMatches.append(face_match)

                if face_match > best_match:
                    best_match = face_match
                    best_img = img

                if face_match >= job_input.faceRecognition.threshold:
                    logger.info(f"Face match threshold reached ({face_match} >= {job_input.faceRecognition.threshold}), stopping early")
                    break
            else:
                best_img = img

        img = best_img
        media_path = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/images/{job.result.fileName}"
        img_payload = storage.prepare_image_payload(img)

        storage.upload_result_image(media_path, img_payload)
        storage.save_result_image_locally(media_path, img_payload)

        job.status = "completed"
        job.result.mediaPath = media_path

        mq.publish_status(job.model_dump())
        logger.info("Completed status has been published")
        message.ack()

    except Exception as error:
        logger.error(f"Error processing job {job.id}: {error}", exc_info=True)
        job.status = "error"
        job.result.errorMessage = str(error)
        mq.publish_status(job.model_dump())
        message.ack()

    finally:
        if loras_loaded:
            inference.unload_loras()
        inference.clear_cache()

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    logger.info(f"Attention backend: {ATTN_BACKEND_NAMES.get(DIFFUSERS_ATTN_BACKEND, DIFFUSERS_ATTN_BACKEND)}")

    try:
        storage.download_models(MODEL_NAME)
        storage.download_models("adaface")
    except Exception as e:
        logger.error(f"Failed to download models: {e}", exc_info=True)
        raise

    try:
        face_recognition.get_app()
    except Exception as e:
        logger.error(f"Failed to initialize face recognition: {e}", exc_info=True)
        raise

    try:
        inference.load_pipeline()
    except Exception as e:
        logger.error(f"Failed to load inference pipeline: {e}", exc_info=True)
        raise

    subscriber = mq.get_subscriber_client()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

    logger.info(f"Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=1),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received.")
            streaming_pull.cancel()
