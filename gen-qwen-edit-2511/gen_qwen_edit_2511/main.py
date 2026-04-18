import os
import json
import multiprocessing

from google.cloud import pubsub_v1

import gen_qwen_edit_2511.logger as log
from gen_qwen_edit_2511.logger import set_job_id, unset_job_id
import gen_qwen_edit_2511.storage as storage
import gen_qwen_edit_2511.message_queue as mq
import gen_qwen_edit_2511.face_recognition as face_recognition
import gen_qwen_edit_2511.utils as utils
import gen_qwen_edit_2511.db as db
from gen_qwen_edit_2511.models import Job

import gen_qwen_edit_2511.inference as inference

logger = log.get_logger(__name__)

PROJECT_ID             = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID        = os.getenv("SUBSCRIPTION_ID", "gen-qwen-edit-2511-sub")
MODEL_NAME             = os.getenv("MODEL_NAME", "qwen-edit-2511")
DIFFUSERS_ATTN_BACKEND = os.getenv("DIFFUSERS_ATTN_BACKEND", "native")
MIN_FACE_MATCH         = float(os.getenv("MIN_FACE_MATCH", "0.4"))
MESSAGE_CONCURRENCY    = int(os.getenv("MESSAGE_CONCURRENCY", "1"))

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

    if job_canceled(job.id):
        message.ack()
        return

    set_job_id(job.id)
    logger.info(f"========= Starting job {job.id} -> group {job.groupId or 'none'} -> order {job.order or 'none'} =========")

    with inference.acquire_pipeline() as pipe, face_recognition.acquire_face_recognition() as fr:
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
                    pipe.sync_loras(job_input.loras)
                except Exception as lora_error:
                    logger.error(f"Failed to sync LoRAs: {lora_error}", exc_info=True)
                    pipe.clear_loras()
                    raise
            else:
                pipe.clear_loras()

            if job_input.faceExpression.enabled:
                logger.info(f"Expression mode: '{job_input.faceExpression.type}' scale={job_input.faceExpression.scale}")

            use_retries = job_input.faceRecognition.enabled or job_input.faceDirection.enabled
            max_runs = job.maxRuns if use_retries else 1
            best_img = None
            best_match = 0.0
            in_range = False  # whether any image fell within [min, max]
            all_imgs: list[tuple[float, object]] = []  # direction-passing images (face_match, img)

            recognition_count = 0  # runs where face recognition was actually performed

            for run_idx in range(max_runs):
                logger.info(f"---------- Run #{run_idx + 1}/{max_runs} ----------")

                img, _ = pipe.run_inference(job_input, reference_images)

                if job_input.faceDirection.enabled:
                    direction_ok = fr.check_face_direction(img, job_input.faceDirection.direction)
                    if not direction_ok:
                        logger.info(f"Direction check failed, skipping image")
                        continue

                recognition_count += 1

                if job_input.faceRecognition.enabled:
                    face_match = fr.check_face_match(img, id_photos)
                    job.result.faceMatches.append(face_match)
                    all_imgs.append((face_match, img))

                    threshold = job_input.faceRecognition.threshold
                    ignored = threshold.max is not None and face_match > threshold.max
                    if ignored:
                        logger.info(f"Face match too high ({face_match} > {threshold.max}), ignoring image")
                    else:
                        if face_match > best_match:
                            best_match = face_match
                            best_img = img

                        if recognition_count == 1 and face_match < MIN_FACE_MATCH:
                            logger.info(f"First recognized run face match too low ({face_match} < {MIN_FACE_MATCH}), stopping early")
                            break

                        if face_match >= threshold.min:
                            in_range = True
                            logger.info(f"Face match min threshold reached ({face_match} >= {threshold.min}), stopping early")
                            break
                else:
                    best_img = img

            if not in_range and all_imgs:
                threshold = job_input.faceRecognition.threshold
                if threshold.max is not None:
                    midpoint_threshold = (threshold.min + threshold.max) / 2.0
                    best_match, best_img = min(all_imgs, key=lambda x: abs(x[0] - midpoint_threshold))
                    logger.info(f"No image in range — using image closest to midpoint threshold {midpoint_threshold:.2f}: {best_match}")
                else:
                    best_match, best_img = min(all_imgs, key=lambda x: abs(x[0] - threshold.min))
                    logger.info(f"No image reached min threshold — using image closest to min threshold {threshold.min}: {best_match}")

            if best_img is None:
                raise RuntimeError("No image was generated — maxRuns may be 0 or all inference runs failed")

            logger.info(f"Best face match {best_match}")

            img = best_img
            if job_input.faceRecognition.enabled:
                job.result.bestFaceMatch = best_match

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
            try:
                mq.publish_status(job.model_dump())
                message.ack()
            except Exception as publish_error:
                logger.error(f"Failed to publish error status for job {job.id}: {publish_error}", exc_info=True)
                message.nack()

        finally:
            pipe.clear_cache()
            unset_job_id()

# ---------------------------------------------------------------------------
# Single-worker entry point — one process, one pipeline instance
# ---------------------------------------------------------------------------

def run_worker(worker_idx: int):
    logger.info(f"[worker {worker_idx}] Starting")

    try:
        face_recognition.get_app(1, base_idx=worker_idx)
    except Exception as e:
        logger.error(f"[worker {worker_idx}] Failed to initialize face recognition: {e}", exc_info=True)
        raise

    try:
        inference.load_pipeline(1, base_idx=worker_idx)
    except Exception as e:
        logger.error(f"[worker {worker_idx}] Failed to load inference pipeline: {e}", exc_info=True)
        raise

    subscriber = mq.get_subscriber_client()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

    logger.info(f"[worker {worker_idx}] Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=1),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info(f"[worker {worker_idx}] Shutdown signal received.")
            streaming_pull.cancel()

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    logger.info(f"Attention backend: {ATTN_BACKEND_NAMES.get(DIFFUSERS_ATTN_BACKEND, DIFFUSERS_ATTN_BACKEND)}")
    logger.info(f"Message concurrency: {MESSAGE_CONCURRENCY}")

    try:
        storage.download_models(MODEL_NAME)
        storage.download_models("adaface")
    except Exception as e:
        logger.error(f"Failed to download models: {e}", exc_info=True)
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
