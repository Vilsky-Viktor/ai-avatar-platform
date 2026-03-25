import os
import json

from google.cloud import pubsub_v1

import gen_ti2i_controlnet.logger as log
import gen_ti2i_controlnet.storage as storage
import gen_ti2i_controlnet.message_queue as mq
import gen_ti2i_controlnet.inference as inference
import gen_ti2i_controlnet.face_recognition as face_recognition
import gen_ti2i_controlnet.utils as utils
import gen_ti2i_controlnet.db as db
import gen_ti2i_controlnet.face_swap as face_swap

logger = log.get_logger(__name__)

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
        "best_run_num": previous.get("bestRunNum", 0),
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
    db_job = db.get_job_by_id(job_id)
    if not db_job or (db_job and db_job["status"] == "canceled"):
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
    control_image_path = input_data.get("controlImage", None)

    id_photos = storage.load_input_images(input_data.get("idPhotoPaths", []))
    reference_images = storage.load_input_images(input_data.get("imagePaths", []))
    control_image = storage.load_input_images([control_image_path])[0] if control_image_path else None
    return id_photos, reference_images, control_image

@utils.timeit
def generate_image(job: dict, reference_images: list, control_image):
    logger.info("Generating image ...")
    params = job.get("input", {})
    img = inference.run_inference(params, reference_images, control_image)
    return img

@utils.timeit
def check_face_match(img, id_photos) -> float | None:
    logger.info("Checking face match ...")
    similarity = face_recognition.run_face_match_check(img, id_photos)
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

def publish_error_result(result: dict, error: Exception, job_id: str, num_runs: int):
    result["status"] = "error"
    result["error"] = str(error)
    result["numRuns"] = num_runs
    logger.info(f"Publishing error status for job {job_id}: no successful runs")
    mq.publish_status(result)

def resend_job_for_retry(job: dict, result: dict, num_runs: int, job_id: str):
    job["numRuns"] = num_runs
    job["result"] = result
    logger.info(f"Resending job {job_id}")
    mq.resend_job(job)

def finalize_completed_result(media_path, result, max_similarity, similarities, num_runs, best_run_num, job, id_photos, reference_images):
    job_input = job.get("input", {})
    face_swap_params = job_input.get("faceSwap", {"enabled": False})
    face_enhancement_params = job_input.get("faceEnhancement", {"enabled": False})
    job_id = job.get("id")
    similarity_threshold = job_input.get("similarityThreshold")

    best_run = best_run_num
    total_runs = num_runs

    if face_swap_params["enabled"] and max_similarity > 0:
        swap_run = num_runs + 1
        img = storage.load_tmp_image_from_local_disk(media_path, best_run)
        img = face_swap.swap_face(reference_images, img, face_swap_params, face_enhancement_params)
        img_payload = storage.prepare_image_payload(img)
        storage.save_result_image_locally(media_path, img_payload, swap_run)

        swap_similarity = check_face_match(img, id_photos)
        logger.info(f"Swap face match {swap_similarity or 0} / threshold {similarity_threshold}. Job {job_id}")
        similarities.append(swap_similarity)
        total_runs = swap_run

        if swap_similarity > max_similarity:
            best_run = swap_run
            max_similarity = swap_similarity

    storage.upload_result_image_from_local_disk(media_path, best_run)
    storage.move_tmp_to_media_cache(media_path, best_run)
    storage.cleanup_tmp_files(media_path, total_runs)

    complete_result(result, media_path, max_similarity, similarities, num_runs)
    mq.publish_status(result)
    logger.info("Completed status has been published")

# ---------------------------------------------------------------------------
# Outcome handlers
# ---------------------------------------------------------------------------

@utils.timeit
def handle_no_face_detected(result: dict, job: dict, img, similarity: float, previous: dict,
                             user_id: str, avatar_id: str, num_runs: int, id_photos, reference_images):
    logger.info("No faces detected")

    media_path = get_media_path(job, user_id, avatar_id)
    img_payload = storage.prepare_image_payload(img)
    storage.save_result_image_locally(media_path, img_payload, num_runs)

    best_run_num = previous["best_run_num"] or num_runs
    updated_similarities = previous["similarities"] + [similarity]
    finalize_completed_result(media_path, result, previous["max_similarity"], updated_similarities, num_runs, best_run_num, job, id_photos, reference_images)

@utils.timeit
def handle_improved_face_match(result: dict, job: dict, img, user_id: str, avatar_id: str,
                                similarity: float, previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    logger.info("Face match is improved")

    media_path = get_media_path(job, user_id, avatar_id)
    img_payload = storage.prepare_image_payload(img)
    storage.save_result_image_locally(media_path, img_payload, num_runs)

    updated_similarities = previous["similarities"] + [similarity]
    similarity_threshold = job.get("input", {}).get("similarityThreshold")
    max_runs = job.get("input", {}).get("maxRuns")

    if num_runs >= max_runs or similarity >= similarity_threshold:
        finalize_completed_result(media_path, result, similarity, updated_similarities, num_runs, num_runs, job, id_photos, reference_images)
    else:
        partial_result = {**result, "mediaPath": media_path, "maxSimilarity": similarity, "similarities": updated_similarities, "bestRunNum": num_runs}
        resend_job_for_retry(job, partial_result, num_runs, job_id)

@utils.timeit
def handle_worse_or_same_face_match(result: dict, job: dict, img, similarity: float,
                             previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    logger.info("Face match is worse or same")

    user_id = job.get("userId")
    avatar_id = job.get("avatarId")
    max_runs = job.get("input", {}).get("maxRuns")
    media_path = get_media_path(job, user_id, avatar_id)
    img_payload = storage.prepare_image_payload(img)
    storage.save_result_image_locally(media_path, img_payload, num_runs)

    updated_similarities = previous["similarities"] + [similarity]

    if num_runs >= max_runs:
        finalize_completed_result(media_path, result, previous["max_similarity"], updated_similarities, num_runs, previous["best_run_num"], job, id_photos, reference_images)
    else:
        partial_result = {**result, "mediaPath": media_path, "maxSimilarity": previous["max_similarity"], "similarities": updated_similarities, "bestRunNum": previous["best_run_num"]}
        resend_job_for_retry(job, partial_result, num_runs, job_id)

@utils.timeit
def handle_inference_error(result: dict, job: dict, error: Exception, previous: dict, num_runs: int, job_id: str, id_photos, reference_images):
    max_runs = job.get("input", {}).get("maxRuns")

    logger.error(f"Error processing job {job_id}: {error}", exc_info=True)

    if num_runs >= max_runs:
        if previous["media_path"]:
            user_id = job.get("userId")
            avatar_id = job.get("avatarId")
            media_path = get_media_path(job, user_id, avatar_id)

            finalize_completed_result(media_path, result, previous["max_similarity"], previous["similarities"], num_runs, previous["best_run_num"], job, id_photos, reference_images)
        else:
            publish_error_result(result, error, job_id, num_runs)
    else:
        resend_job_for_retry(job, job.get("result", {}), num_runs, job_id)

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
        if previous["best_run_num"] > 0:
            media_path = get_media_path(job, user_id, avatar_id)
            storage.cleanup_tmp_files(media_path, num_runs)
        message.ack()
        return

    if should_skip_job(job, num_runs):
        message.ack()
        return

    if is_first_run(num_runs):
        mq.publish_status(result)

    num_runs += 1

    id_photos, reference_images, control_image = load_images(job)

    try:
        if check_dependency_image_existence:
            if len(id_photos) != len(id_photo_paths) or len(reference_images) != len(image_paths):
                logger.warning(f"Missing dependency images, skipping job {job_id}")
                message.nack()
                return

        img = generate_image(job, reference_images, control_image)
        similarity = check_face_match(img, id_photos)

        logger.info(f"Face match {similarity or 0} / threshold {similarity_threshold}. Job {job_id}")

        if similarity < 0.4 or not id_photo_paths:
            handle_no_face_detected(result, job, img, similarity, previous, user_id, avatar_id, num_runs, id_photos, reference_images)
        elif similarity > previous["max_similarity"]:
            handle_improved_face_match(result, job, img, user_id, avatar_id, similarity, previous, num_runs, job_id, id_photos, reference_images)
        else:
            handle_worse_or_same_face_match(result, job, img, similarity, previous, num_runs, job_id, id_photos, reference_images)

        message.ack()

    except Exception as error:
        handle_inference_error(result, job, error, previous, num_runs, job_id, id_photos, reference_images)
        message.ack()

# ---------------------------------------------------------------------------
# Main entry point — streaming pull with concurrency
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    storage.download_models(MODEL_NAME)
    storage.download_dummy_images()
    dummy_images = storage.load_dummy_images(inference.WARMUP_RESOLUTIONS)
    dummy_pose_images = storage.load_dummy_pose_images(inference.WARMUP_RESOLUTIONS)

    face_swap.download_models()
    face_swap.load_processors()
    face_swap.warmup(dummy_images)

    face_recognition.get_app()
    face_recognition.warmup(dummy_images)

    inference.load_pipeline()
    inference.warmup(dummy_images, dummy_pose_images)

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
