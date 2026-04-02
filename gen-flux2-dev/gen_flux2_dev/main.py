import os
import json

from google.cloud import pubsub_v1

import gen_flux2_dev.logger as log
import gen_flux2_dev.storage as storage
import gen_flux2_dev.message_queue as mq
import gen_flux2_dev.inference as inference
import gen_flux2_dev.face_recognition as face_recognition
import gen_flux2_dev.utils as utils
import gen_flux2_dev.db as db

logger = log.get_logger(__name__)

PROJECT_ID          = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID     = os.getenv("SUBSCRIPTION_ID", "gen-flux2-dev-sub")
MODEL_NAME          = os.getenv("MODEL_NAME", "flux.2-dev")
DIFFUSERS_ATTN_BACKEND = os.getenv("DIFFUSERS_ATTN_BACKEND", "native")

# ---------------------------------------------------------------------------
# Job parsing helpers
# ---------------------------------------------------------------------------

def parse_job(message: pubsub_v1.subscriber.message.Message) -> dict:
    return json.loads(message.data.decode("utf-8"))

def build_initial_result(job: dict) -> dict:
    return {
        "userId": job.get("userId", ""),
        "avatarId": job.get("avatarId", ""),
        "jobId": job.get("id", "unknown"),
        "type": job.get("type", ""),
        "mediaPath": None,
        "status": "generating",
        "error": None,
    }

def job_canceled(job_id: str):
    db_job = db.get_job_by_id(job_id)
    if not db_job or db_job["status"] == "canceled":
        logger.info(f"Job {job_id} was removed or canceled")
        return True

    return False

# ---------------------------------------------------------------------------
# Inference pipeline
# ---------------------------------------------------------------------------

@utils.timeit
def load_images(job: dict) -> tuple:
    logger.info("Loading dependency images ...")
    input_data = job.get("input", {})
    inference_config = input_data.get("inference", {})
    controlnet_params = input_data.get("controlnet", {})

    id_photos = storage.load_input_images(inference_config.get("idPhotoPaths", []))
    reference_images = storage.load_input_images(inference_config.get("imagePaths", []))
    control_image = storage.load_input_images([controlnet_params.get("imagePath")])[0] if controlnet_params.get("enabled", False) else None
    return id_photos, reference_images, control_image

@utils.timeit
def check_face_matches(imgs: list, id_photos) -> list[float]:
    logger.info("Checking face match ...")
    similarities = face_recognition.run_face_match_check(imgs, id_photos)
    return [round(s, 4) for s in similarities]

def get_media_path(job, user_id, avatar_id):
    job_input = job.get("input", {})
    result_file_name = job_input.get("resultFileName", None)
    media_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{result_file_name}"

    return media_path

# ---------------------------------------------------------------------------
# Result publishing
# ---------------------------------------------------------------------------

def complete_result(result: dict, media_path: str, similarity: float | None, similarities: list, total_runs: int) -> dict:
    result["status"] = "completed"
    result["mediaPath"] = media_path
    result["maxSimilarity"] = similarity if similarity is not None else -1
    result["similarities"] = similarities
    result["numRuns"] = total_runs
    return result

# ---------------------------------------------------------------------------
# Main job processor — runs on Pub/Sub callback thread
# ---------------------------------------------------------------------------

@utils.timeit
def process_job(message: pubsub_v1.subscriber.message.Message):
    job = parse_job(message)
    job_id = job.get("id", "unknown")
    user_id = job.get("userId", "")
    avatar_id = job.get("avatarId", "")
    job_input = job.get("input", {})
    check_dependency_image_existence = job_input.get("checkDependencyImageExistence", False)
    inference_config = job_input.get("inference", {})
    image_paths = inference_config.get("imagePaths", [])
    id_photo_paths = inference_config.get("idPhotoPaths", [])
    inference_levels = inference_config.get("inferenceLevels", [])
    job_order = job.get("order", None)
    total_runs = 0

    result = build_initial_result(job)

    logger.info(f"========= Processing job {job_id}, order {job_order or 'none'} =========")

    if job_canceled(job_id):
        message.ack()
        return

    mq.publish_status(result)

    try:
        id_photos, reference_images, control_image = load_images(job)

        if check_dependency_image_existence:
            if len(id_photos) != len(id_photo_paths) or len(reference_images) != len(image_paths):
                logger.warning(f"Missing dependency images, skipping job {job_id}")
                message.nack()
                return

        similarities = []

        if not inference_levels:
            inference_levels = [{"numRuns": 1, "numInferenceSteps": 20, "width": 1024, "height": 1024}]

        top_seeds = None  # None = generate randomly on first level

        for level_idx, level in enumerate(inference_levels):
            level_runs = level["numRuns"]
            num_steps = level["numInferenceSteps"]
            level_w = level["width"]
            level_h = level["height"]
            is_last = level_idx == len(inference_levels) - 1

            level_reference_images = [img.resize((level_w, level_h)) for img in reference_images]
            level_id_photos = [img.resize((level_w, level_h)) for img in id_photos]

            seeds = top_seeds if top_seeds is not None else [None] * level_runs

            level_imgs = []
            level_seeds = []
            for run_idx, seed in enumerate(seeds):
                logger.info(f"---------- Level {level_idx + 1}/{len(inference_levels)} run #{run_idx + 1} ----------")
                img, actual_seed = inference.run_inference(job_input, level_reference_images, control_image, num_steps, seed, level_w, level_h, run_num=total_runs)
                level_imgs.append(img)
                level_seeds.append(actual_seed)
                total_runs += 1

            face_matches = check_face_matches(level_imgs, level_id_photos)

            ranked = sorted(zip(face_matches, level_seeds, level_imgs), key=lambda x: x[0], reverse=True)

            for fm, s, _ in ranked:
                logger.info(f"Level {level_idx + 1} seed {s} - face match {fm}")
                similarities.append(fm)

            if is_last:
                best_face_match, seed, best_img = ranked[0]
            else:
                next_num_runs = inference_levels[level_idx + 1]["numRuns"]
                top_seeds = [s for _, s, _ in ranked[:next_num_runs]]

        img = best_img

        logger.info(f"Best face match {best_face_match}")

        media_path = get_media_path(job, user_id, avatar_id)
        img_payload = storage.prepare_image_payload(img)

        storage.upload_result_image(media_path, img_payload)
        storage.save_result_image_locally(media_path, img_payload)
        complete_result(result, media_path, best_face_match, similarities, total_runs)

        mq.publish_status(result)
        logger.info("Completed status has been published")

        message.ack()

    except Exception as error:
        logger.error(f"Error processing job {job_id}: {error}", exc_info=True)
        message.ack()

    finally:
        inference.clear_cache()

# ---------------------------------------------------------------------------
# Main entry point — streaming pull with concurrency
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _attn_backend_names = {"flash": "Flash Attention 2", "_flash_3": "Flash Attention 3", "native": "PyTorch SDPA"}
    logger.info(f"Attention backend: {_attn_backend_names.get(DIFFUSERS_ATTN_BACKEND, DIFFUSERS_ATTN_BACKEND)}")

    try:
        storage.download_models(MODEL_NAME)
        storage.download_models("adaface")
        storage.download_dummy_images()
    except Exception as e:
        logger.error(f"Failed to download models or dummy images: {e}", exc_info=True)
        raise

    dummy_images = storage.load_dummy_images(inference.WARMUP_RESOLUTIONS)
    dummy_pose_images = storage.load_dummy_pose_images(inference.WARMUP_RESOLUTIONS)

    try:
        face_recognition.get_app()
        face_recognition.warmup(dummy_images)
    except Exception as e:
        logger.error(f"Failed to initialize face recognition: {e}", exc_info=True)
        raise

    try:
        inference.load_pipeline()
        inference.warmup(dummy_images, dummy_pose_images)
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
