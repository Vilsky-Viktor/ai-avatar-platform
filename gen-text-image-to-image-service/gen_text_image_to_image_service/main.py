import os
import json
import uuid

from google.cloud import pubsub_v1

import gen_text_image_to_image_service.logger as log_module
import gen_text_image_to_image_service.storage as storage_module
import gen_text_image_to_image_service.message_queue as mq_module
import gen_text_image_to_image_service.ai_model as model_module
import gen_text_image_to_image_service.face_similarity as similarity_module
# import gen_text_image_to_image_service.termination_timer as timer_module

logger = log_module.get_logger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")
MESSAGE_CONCURRENCY = int(os.getenv("MESSAGE_CONCURRENCY", "1"))


def process_job(message: pubsub_v1.subscriber.message.Message):
    # timer_module.reset_inactivity_timer()
    
    job = json.loads(message.data.decode("utf-8"))
    job_id = job.get("id", "unknown")
    user_id, avatar_id = job.get("userId", ""), job.get("avatarId", "")
    
    logger.info(f"Processing job: {job_id}")
    
    model_result = {
        "userId": user_id, "avatarId": avatar_id, "jobId": job_id,
        "type": job.get("type", ""), "resultPath": None, "status": "generating", "error": None
    }
    
    try:
        mq_module.publish_status(model_result)
        model_params = model_module.prepare_params(job.get("input", {}))
        
        logger.info(f"model params {model_params}")

        id_photos = storage_module.load_input_images(
            job.get("input", {}).get("idPhotoPaths", []), 
            model_module.get_upsampling_model()
        )
        reference_images = storage_module.load_input_images(
            job.get("input", {}).get("imagePaths", []), 
            model_module.get_upsampling_model()
        )
        final_prompt = model_module.refine_prompt(model_params, reference_images)
        img = model_module.run_inference(model_params, reference_images, final_prompt)
        img, max_similarity, min_similarity, num_tries = similarity_module.run_similarity_check(model_params, final_prompt, img, id_photos, reference_images)

        result_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{uuid.uuid4()}.png"
        img_payload = storage_module.prepare_image_payload(img)

        storage_module.upload_result_image(result_path, img_payload)
        
        model_result["resultPath"] = result_path
        model_result["status"] = "completed"
        model_result["minSimilarity"] = min_similarity
        model_result["maxSimilarity"] = max_similarity
        model_result["num_tries"] = num_tries
        message.ack()
    except Exception as error:
        logger.error(f"Error processing job {job_id}: {error}", exc_info=True)
        model_result["status"] = "error"
        model_result["error"] = str(error)
        message.nack()
    finally:
        mq_module.publish_status(model_result)
        # timer_module.reset_inactivity_timer()

if __name__ == "__main__":
    storage_module.download_models(MODEL_NAME)
    model_module.load_models_into_vram()

    # timer_module.reset_inactivity_timer()

    subscriber = mq_module.get_subscriber_client()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
    
    logger.info(f"Subscribed to: {sub_path}")
    
    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path, 
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=MESSAGE_CONCURRENCY)
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received.")
            # if timer_module.inactivity_timer:
            #     timer_module.inactivity_timer.cancel()
            streaming_pull.cancel()