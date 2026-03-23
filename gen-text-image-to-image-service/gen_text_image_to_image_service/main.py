import os
import json

from google.cloud import pubsub_v1

import gen_text_image_to_image_service.logger as log_module
import gen_text_image_to_image_service.storage as storage_module
import gen_text_image_to_image_service.message_queue as mq_module
import gen_text_image_to_image_service.ai_model as model_module
import gen_text_image_to_image_service.face_similarity as similarity_module
import gen_text_image_to_image_service.utils as utils_module
import gen_text_image_to_image_service.db as db_module
import gen_text_image_to_image_service.face_swap as face_swap_module

logger = log_module.get_logger(__name__)

PROJECT_ID          = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID     = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
MODEL_NAME          = os.getenv("MODEL_NAME", "flux.2-dev")

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

def extract_previous_result(job: dict) -> dict:
    previous = job.get("result", {})
    return {
        "max_similarity": previous.get("maxSimilarity", 0),
        "similarities": previous.get("similarities", []),
        "media_path": previous.get("mediaPath", ""),
    }

# ---------------------------------------------------------------------------
# Early-exit checks
# ---------------------------------------------------------------------------

def should_skip_job(job: dict, num_runs: int) -> bool:
    max_runs = job.get("input", {}).get("maxRuns")
    return num_runs >= max_runs or job.get("status") == "completed"

def is_first_run(num_runs: int) -> bool:
    return num_runs == 0

def job_canceled(job_id: str):
    db_job = db_module.get_job_by_id(job_id)
    if not db_job or (db_job and db_job["status"] == "canceled"):
        logger.info(f"Job {job_id} was removed or canceled")
        return True
    
    return False

# ---------------------------------------------------------------------------
# Inference pipeline
# ---------------------------------------------------------------------------

@utils_module.timeit
def load_images(job: dict) -> tuple:
    input_data = job.get("input", {})
    upsampler = model_module.get_upsampling_model()
    id_photos = storage_module.load_input_images(input_data.get("idPhotoPaths", []), upsampler)
    reference_images = storage_module.load_input_images(input_data.get("imagePaths", []), upsampler)
    return id_photos, reference_images

@utils_module.timeit
def generate_image(job: dict, reference_images: list):
    model_params = model_module.prepare_params(job.get("input", {}))
    final_prompt = model_module.refine_prompt(model_params, reference_images)
    avatar_id = job.get("avatarId", "")
    img = model_module.run_inference(avatar_id, model_params, reference_images, final_prompt)
    return img, model_params

@utils_module.timeit
def check_face_similarity(img, id_photos) -> float | None:
    similarity = similarity_module.run_similarity_check(img, id_photos)
    return round(similarity, 4)

def get_media_path(job, user_id, avatar_id):
    job_input = job.get("input", {})
    result_file_name = job_input.get("resultFileName", None)
    media_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{result_file_name}"

    return media_path

# ---------------------------------------------------------------------------
# Result publishing
# ---------------------------------------------------------------------------

def complete_result(result: dict, media_path: str, similarity: float | None, similarities: list, num_runs: int) -> dict:
    result["status"] = "completed"
    result["mediaPath"] = media_path
    result["maxSimilarity"] = similarity if similarity is not None else -1
    result["similarities"] = similarities
    result["numRuns"] = num_runs
    return result

def publish_completed_result(result: dict, job_id: str):
    logger.info(f"Publishing completed status for job {job_id}")
    mq_module.publish_status(result)

def publish_error_result(result: dict, error: Exception, job_id: str, num_runs: int):
    result["status"] = "error"
    result["error"] = str(error)
    result["numRuns"] = num_runs
    logger.info(f"Publishing error status for job {job_id}: no successful runs")
    mq_module.publish_status(result)

def resend_job_for_retry(job: dict, result: dict, num_runs: int, job_id: str):
    job["numRuns"] = num_runs
    job["result"] = result
    logger.info(f"Resending job {job_id}")
    mq_module.resend_job(job)

def finalize_completed_result(media_path, result, max_similarity, similarities, num_runs, job, id_photos, reference_images):
    job_input = job.get("input", {})
    face_swap_params = job_input.get("faceSwap", {"enabled": False})
    face_enhancement_params = job_input.get("faceEnhancement", {"enabled": False})
    job_id = job.get("id")
    similarity_threshold = job_input.get("similarityThreshold")

    if face_swap_params["enabled"] and max_similarity > 0:
        img = storage_module.load_tmp_image_from_local_disk(media_path)
        img = face_swap_module.swap_face(reference_images, img, face_swap_params, face_enhancement_params)
        img_payload = storage_module.prepare_image_payload(img)

        swap_similarity = check_face_similarity(img, id_photos)
        logger.info(f"Swap face match {swap_similarity or 0} / threshold {similarity_threshold}. Job {job_id}")

        if swap_similarity > max_similarity:
            logger.info("Apply face swap version")
            storage_module.save_result_image_locally(media_path, img_payload)
            max_similarity = swap_similarity
        else:
            logger.info("Keep generated version")
        
        similarities.append(swap_similarity)

    storage_module.upload_result_image_from_local_disk(media_path)
    storage_module.rename_completed_local_image(media_path)

    complete_result(result, media_path, max_similarity, similarities, num_runs)
    publish_completed_result(result, job_id)

# ---------------------------------------------------------------------------
# Outcome handlers
# ---------------------------------------------------------------------------

@utils_module.timeit
def handle_no_face_detected(result: dict, job: dict, img, user_id: str, avatar_id: str, num_runs: int, id_photos, reference_images):
    logger.info("No faces detected")

    media_path = get_media_path(job, user_id, avatar_id)

    img_payload = storage_module.prepare_image_payload(img)
    storage_module.save_result_image_locally(media_path, img_payload)

    finalize_completed_result(media_path, result, 0, [], num_runs, job, id_photos, reference_images)

@utils_module.timeit
def handle_improved_similarity(result: dict, job: dict, img, user_id: str, avatar_id: str,
                                similarity: float, previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    logger.info("Face match is improved")

    media_path = get_media_path(job, user_id, avatar_id)
    img_payload = storage_module.prepare_image_payload(img)

    storage_module.save_result_image_locally(media_path, img_payload)

    updated_similarities = previous["similarities"] + [similarity]
    similarity_threshold = job.get("input", {}).get("similarityThreshold")
    max_runs = job.get("input", {}).get("maxRuns")

    if num_runs >= max_runs or similarity >= similarity_threshold:
        finalize_completed_result(media_path, result, similarity, updated_similarities, num_runs, job, id_photos, reference_images)
    else:
        partial_result = {**result, "mediaPath": media_path, "maxSimilarity": similarity, "similarities": updated_similarities}
        resend_job_for_retry(job, partial_result, num_runs, job_id)

@utils_module.timeit
def handle_worse_or_same_similarity(result: dict, job: dict, similarity: float,
                             previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    logger.info("Face match is worse or same")

    user_id = job.get("userId")
    avatar_id = job.get("avatarId")
    max_runs = job.get("input", {}).get("maxRuns")
    media_path = get_media_path(job, user_id, avatar_id)
    updated_similarities = previous["similarities"] + [similarity]
    
    if num_runs >= max_runs:
        finalize_completed_result(media_path, result, previous["max_similarity"], updated_similarities, num_runs, job, id_photos, reference_images)
    else:
        partial_result = {**result, "mediaPath": media_path, "maxSimilarity": previous["max_similarity"], "similarities": updated_similarities}
        resend_job_for_retry(job, partial_result, num_runs, job_id)

@utils_module.timeit
def handle_inference_error(result: dict, job: dict, error: Exception, previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    max_runs = job.get("input", {}).get("maxRuns")

    logger.error(f"Error processing job {job_id}: {error}", exc_info=True)

    if num_runs >= max_runs:
        if previous["media_path"]:
            user_id = job.get("userId")
            avatar_id = job.get("avatarId")
            media_path = get_media_path(job, user_id, avatar_id)

            finalize_completed_result(media_path, result, previous["max_similarity"], previous["similarities"], num_runs, job, id_photos, reference_images)
        else:
            publish_error_result(result, error, job_id, num_runs)
    else:
        resend_job_for_retry(job, job.get("result", {}), num_runs, job_id)

# ---------------------------------------------------------------------------
# Main job processor — runs on Pub/Sub callback thread
# ---------------------------------------------------------------------------

@utils_module.timeit
def process_job(message: pubsub_v1.subscriber.message.Message):
    job = parse_job(message)
    job_id = job.get("id", "unknown")
    user_id = job.get("userId", "")
    avatar_id = job.get("avatarId", "")
    job_input = job.get("input", {})
    check_dependency_image_existence = job_input.get("checkDependencyImageExistance", False)
    max_runs = job_input.get("maxRuns")
    similarity_threshold = job_input.get("similarityThreshold")
    num_runs = job.get("numRuns", 0)
    image_paths = job_input.get("imagePaths", [])
    id_photo_paths = job_input.get("idPhotoPaths", [])
    
    previous = extract_previous_result(job)
    result = build_initial_result(job)

    logger.info(f"========= Processing job {job_id}, run {num_runs + 1}/{max_runs} =========")

    if job_canceled(job_id):
        message.ack()
        return

    if should_skip_job(job, num_runs):
        message.ack()
        return

    if is_first_run(num_runs):
        mq_module.publish_status(result)

    num_runs += 1

    id_photos, reference_images = load_images(job)

    try:
        if check_dependency_image_existence:
            if len(id_photos) != len(id_photo_paths) or len(reference_images) != len(image_paths):
                logger.warning(f"Missing dependency images, skipping job {job_id}")
                message.nack()
                return


        img, _ = generate_image(job, reference_images)
        similarity = check_face_similarity(img, id_photos)

        logger.info(f"Face match {similarity or 0} / threshold {similarity_threshold}. Job {job_id}")

        if similarity < 0.4 or not id_photo_paths:
            handle_no_face_detected(result, job, img, user_id, avatar_id, num_runs, id_photos, reference_images)
        elif similarity > previous["max_similarity"]:
            handle_improved_similarity(result, job, img, user_id, avatar_id, similarity, previous, num_runs, job_id, id_photos, reference_images)
        else:
            handle_worse_or_same_similarity(result, job, similarity, previous, num_runs, job_id, id_photos, reference_images)

        message.ack()

    except Exception as error:
        handle_inference_error(result, job, error, previous, num_runs, job_id, id_photos, reference_images)
        message.ack()  # ack — retry logic handled by resend_job_for_retry

# ---------------------------------------------------------------------------
# Main entry point — streaming pull with concurrency
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    storage_module.download_models(MODEL_NAME)
    model_module.load_models_into_vram()
    similarity_module.get_face_app()

    subscriber = mq_module.get_subscriber_client()
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