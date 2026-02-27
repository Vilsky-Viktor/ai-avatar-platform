import os
import json
import uuid

from google.cloud import pubsub_v1

import gen_text_image_to_image_service.logger as log_module
import gen_text_image_to_image_service.storage as storage_module
import gen_text_image_to_image_service.message_queue as mq_module
import gen_text_image_to_image_service.ai_model as model_module
import gen_text_image_to_image_service.face_similarity as similarity_module

logger = log_module.get_logger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")
MESSAGE_CONCURRENCY = int(os.getenv("MESSAGE_CONCURRENCY", "1"))
MIN_ALLOWED_SIMILARITY = float(os.getenv("MIN_ALLOWED_SIMILARITY", 0.7))
MAX_JOB_RUNS = int(os.getenv("MAX_JOB_RUNS", 5))


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


# ---------------------------------------------------------------------------
# Inference pipeline
# ---------------------------------------------------------------------------

def load_images(job: dict) -> tuple:
    input_data = job.get("input", {})
    upsampler = model_module.get_upsampling_model()
    id_photos = storage_module.load_input_images(input_data.get("idPhotoPaths", []), upsampler)
    reference_images = storage_module.load_input_images(input_data.get("imagePaths", []), upsampler)
    return id_photos, reference_images


def generate_image(job: dict, reference_images: list):
    model_params = model_module.prepare_params(job.get("input", {}))
    final_prompt = model_module.refine_prompt(model_params, reference_images)
    img = model_module.run_inference(model_params, reference_images, final_prompt)
    return img, model_params


def check_face_similarity(img, id_photos) -> float | None:
    return similarity_module.run_similarity_check(img, id_photos)


def upload_image(img, user_id: str, avatar_id: str) -> str:
    width, height = img.size
    media_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{uuid.uuid4()}-{width}x{height}.png"
    img_payload = storage_module.prepare_image_payload(img)
    storage_module.upload_result_image(media_path, img_payload)
    return media_path


# ---------------------------------------------------------------------------
# Result publishing
# ---------------------------------------------------------------------------

def publish_generating_status(result: dict):
    mq_module.publish_status(result)


def complete_result(result: dict, media_path: str, similarity: float | None, similarities: list, num_runs: int) -> dict:
    result["status"] = "completed"
    result["mediaPath"] = media_path
    result["maxSimilarity"] = similarity if similarity is not None else -1
    result["similarities"] = similarities
    result["numRuns"] = num_runs
    return result


def publish_completed_result(result: dict, job_id: str, reason: str):
    logger.info(f"Publishing completed status for job {job_id}: {reason}")
    mq_module.publish_status(result)


def publish_error_result(result: dict, error: Exception, job_id: str, num_runs: int):
    result["status"] = "error"
    result["error"] = str(error)
    result["numRuns"] = num_runs
    logger.info(f"Publishing error status for job {job_id}: no successful runs")
    mq_module.publish_status(result)


def resend_job_for_retry(job: dict, result: dict, num_runs: int, job_id: str, reason: str):
    job["numRuns"] = num_runs
    job["result"] = result
    logger.info(f"Resending job {job_id}: {reason}")
    mq_module.resend_job(job)


# ---------------------------------------------------------------------------
# Outcome handlers
# ---------------------------------------------------------------------------

def handle_no_faces_detected(result: dict, img, user_id: str, avatar_id: str, num_runs: int, job_id: str):
    media_path = upload_image(img, user_id, avatar_id)
    complete_result(result, media_path, similarity=None, similarities=[], num_runs=num_runs)
    publish_completed_result(result, job_id, reason="no face detected — skipping similarity retries")


def handle_improved_similarity(result: dict, job: dict, img, user_id: str, avatar_id: str,
                                similarity: float, previous: dict, num_runs: int, job_id: str):
    media_path = upload_image(img, user_id, avatar_id)
    updated_similarities = previous["similarities"] + [similarity]
    similarity_threshold = job.get("input", {}).get("similarityThreshold")
    max_runs = job.get("input", {}).get("maxRuns")

    if num_runs >= max_runs or similarity >= similarity_threshold:
        reason = "max runs reached" if num_runs >= max_runs else f"similarity {similarity} >= threshold {similarity_threshold}"
        complete_result(result, media_path, similarity, updated_similarities, num_runs)
        publish_completed_result(result, job_id, reason)
    else:
        partial_result = {**result, "mediaPath": media_path, "maxSimilarity": similarity, "similarities": updated_similarities}
        resend_job_for_retry(job, partial_result, num_runs, job_id, reason=f"similarity {similarity} below threshold {similarity_threshold}")


def handle_worse_similarity(result: dict, job: dict, similarity: float,
                             previous: dict, num_runs: int, job_id: str):
    updated_similarities = previous["similarities"] + [similarity]
    similarity_threshold = job.get("input", {}).get("similarityThreshold")
    max_runs = job.get("input", {}).get("maxRuns")

    if num_runs >= max_runs:
        complete_result(result, previous["media_path"], previous["max_similarity"], updated_similarities, num_runs)
        publish_completed_result(result, job_id, reason=f"max runs reached, best similarity was {previous['max_similarity']}")
    else:
        partial_result = {**result, "mediaPath": previous["media_path"], "maxSimilarity": previous["max_similarity"], "similarities": updated_similarities}
        resend_job_for_retry(job, partial_result, num_runs, job_id, reason=f"similarity {similarity} below threshold {similarity_threshold}")


def handle_inference_error(result: dict, job: dict, error: Exception, previous: dict, num_runs: int, job_id: str):
    max_runs = job.get("input", {}).get("maxRuns")

    logger.error(f"Error processing job {job_id}: {error}", exc_info=True)

    if num_runs >= max_runs:
        if previous["media_path"]:
            complete_result(result, previous["media_path"], previous["max_similarity"], previous["similarities"], num_runs)
            publish_completed_result(result, job_id, reason=f"max runs reached with prior best similarity {previous['max_similarity']}")
        else:
            publish_error_result(result, error, job_id, num_runs)
    else:
        resend_job_for_retry(job, job.get("result", {}), num_runs, job_id, reason=f"error on run {num_runs}: {error}")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def process_job(message: pubsub_v1.subscriber.message.Message):
    job = parse_job(message)
    job_id = job.get("id", "unknown")
    user_id = job.get("userId", "")
    avatar_id = job.get("avatarId", "")

    num_runs = int(job.get("numRuns", 0))
    previous = extract_previous_result(job)
    result = build_initial_result(job)

    if should_skip_job(job, num_runs):
        message.ack()
        return

    if is_first_run(num_runs):
        publish_generating_status(result)

    num_runs += 1
    logger.info(f"Processing job {job_id}, run {num_runs}/{MAX_JOB_RUNS}")

    try:
        id_photos, reference_images = load_images(job)
        img, _ = generate_image(job, reference_images)
        similarity = check_face_similarity(img, id_photos)

        if similarity is None:
            handle_no_faces_detected(result, img, user_id, avatar_id, num_runs, job_id)
        elif similarity >= previous["max_similarity"]:
            handle_improved_similarity(result, job, img, user_id, avatar_id, similarity, previous, num_runs, job_id)
        else:
            handle_worse_similarity(result, job, similarity, previous, num_runs, job_id)

    except Exception as error:
        handle_inference_error(result, job, error, previous, num_runs, job_id)

    finally:
        message.ack()


if __name__ == "__main__":
    storage_module.download_models(MODEL_NAME)
    model_module.load_models_into_vram()

    subscriber = mq_module.get_subscriber_client()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

    logger.info(f"Subscribed to: {sub_path}")

    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path,
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=MESSAGE_CONCURRENCY),
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received.")
            streaming_pull.cancel()