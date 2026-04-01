import os
import json

from google.cloud import pubsub_v1

import gen_qwen_edit_2511.logger as log
import gen_qwen_edit_2511.storage as storage
import gen_qwen_edit_2511.message_queue as mq
import gen_qwen_edit_2511.inference as inference
import gen_qwen_edit_2511.face_recognition as face_recognition
import gen_qwen_edit_2511.utils as utils
import gen_qwen_edit_2511.db as db
from gen_qwen_edit_2511.models import Job, InferenceLevel

logger = log.get_logger(__name__)

PROJECT_ID      = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "gen-qwen-edit-2511-sub")
MODEL_NAME      = os.getenv("MODEL_NAME", "qwen-edit-2511")

DEFAULT_INFERENCE_LEVEL = InferenceLevel(numRuns=1, numInferenceSteps=40, width=1328, height=1328)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def job_canceled(job_id: str) -> bool:
    db_job = db.get_job_by_id(job_id)
    if not db_job or db_job["status"] == "canceled":
        logger.info(f"Job {job_id} was removed or canceled")
        return True
    return False


@utils.timeit
def check_face_matches(imgs: list, id_photos: list) -> list[float]:
    logger.info("Checking face match ...")
    similarities = face_recognition.run_face_match_check(imgs, id_photos)
    return [round(s, 4) for s in similarities]


# ---------------------------------------------------------------------------
# Main job processor — runs on Pub/Sub callback thread
# ---------------------------------------------------------------------------

@utils.timeit
def process_job(message: pubsub_v1.subscriber.message.Message):
    job = Job.model_validate(json.loads(message.data.decode("utf-8")))
    job_input = job.input
    inf = job_input.inference
    inference_levels = inf.inferenceLevels or [DEFAULT_INFERENCE_LEVEL]
    total_runs = 0
    loras_loaded = False

    result = {
        "userId":    job.userId,
        "avatarId":  job.avatarId,
        "jobId":     job.id,
        "type":      job.type,
        "mediaPath": None,
        "status":    "generating",
        "error":     None,
    }

    logger.info(f"========= Processing job {job.id}, order {job.order or 'none'} =========")

    if job_canceled(job.id):
        message.ack()
        return

    mq.publish_status(result)

    try:
        logger.info("Loading dependency images ...")
        id_photos = storage.load_input_images(inf.idPhotoPaths)
        reference_images = storage.load_input_images(inf.imagePaths)

        if job_input.checkDependencyImageExistence:
            if len(id_photos) != len(inf.idPhotoPaths) or len(reference_images) != len(inf.imagePaths):
                logger.warning(f"Missing dependency images, skipping job {job.id}")
                message.nack()
                return

        if job_input.loras:
            for lora in job_input.loras:
                storage.ensure_lora_downloaded(lora.path)
            inference.load_loras(job_input.loras)
            loras_loaded = True

        similarities = []
        top_seeds = None

        for level_idx, level in enumerate(inference_levels):
            is_last = level_idx == len(inference_levels) - 1

            seeds = top_seeds if top_seeds is not None else [None] * level.numRuns

            level_imgs = []
            level_seeds = []
            for run_idx, seed in enumerate(seeds):
                logger.info(f"---------- Level {level_idx + 1}/{len(inference_levels)} run #{run_idx + 1} ----------")
                img, actual_seed = inference.run_inference(
                    job_input, reference_images, level.numInferenceSteps, seed,
                    level.width, level.height, run_num=total_runs,
                )
                level_imgs.append(img)
                level_seeds.append(actual_seed)
                total_runs += 1

            face_matches = check_face_matches(level_imgs, id_photos)
            ranked = sorted(zip(face_matches, level_seeds, level_imgs), key=lambda x: x[0], reverse=True)

            for fm, s, _ in ranked:
                logger.info(f"Level {level_idx + 1} seed {s} - face match {fm}")
                similarities.append(fm)

            if is_last:
                best_face_match, _, best_img = ranked[0]
            else:
                next_runs = inference_levels[level_idx + 1].numRuns
                top_seeds = [s for _, s, _ in ranked[:next_runs]]

        logger.info(f"Best face match {best_face_match}")

        img = best_img
        media_path = f"media/{job.userId}-user/avatars/{job.avatarId}-avatar/images/{job_input.resultFileName}"
        img_payload = storage.prepare_image_payload(img)

        storage.upload_result_image(media_path, img_payload)
        storage.save_result_image_locally(media_path, img_payload)

        result.update({
            "status":        "completed",
            "mediaPath":     media_path,
            "maxSimilarity": best_face_match,
            "similarities":  similarities,
            "numRuns":       total_runs,
        })

        mq.publish_status(result)
        logger.info("Completed status has been published")
        message.ack()

    except Exception as error:
        logger.error(f"Error processing job {job.id}: {error}", exc_info=True)
        message.ack()

    finally:
        if loras_loaded:
            inference.unload_loras()
        inference.clear_cache()

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
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
