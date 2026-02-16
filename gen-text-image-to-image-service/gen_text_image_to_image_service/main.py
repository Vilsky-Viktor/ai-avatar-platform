import os
import json
import uuid
import threading
import subprocess
from google.cloud import pubsub_v1

import gen_text_image_to_image_service.logger as log_module
import gen_text_image_to_image_service.storage as storage_module
import gen_text_image_to_image_service.message_queue as mq_module
import gen_text_image_to_image_service.ai_model as model_module

logger = log_module.get_logger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")
RUNPOD_POD_ID = os.getenv("RUNPOD_POD_ID")
INACTIVITY_TIMEOUT = int(os.getenv("INACTIVITY_TIMEOUT", "300"))

inactivity_timer = None

def terminate_pod():
    if not RUNPOD_POD_ID:
        logger.error("Inactivity timeout: RUNPOD_POD_ID is missing. Cannot terminate.")
        return

    logger.info(f"Inactivity timeout reached. Terminating pod {RUNPOD_POD_ID}...")
    try:
        subprocess.run(["runpodctl", "remove", "pod", RUNPOD_POD_ID], check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"runpodctl failed: {e}")

def reset_inactivity_timer():
    global inactivity_timer
    if inactivity_timer:
        inactivity_timer.cancel()
    
    inactivity_timer = threading.Timer(INACTIVITY_TIMEOUT, terminate_pod)
    inactivity_timer.start()
    logger.info("Inactivity timer reset.")

def process_job(message: pubsub_v1.subscriber.message.Message):
    reset_inactivity_timer()
    
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
        params = model_module.prepare_params(job.get("input", {}))
        img_ctx = storage_module.load_input_images(
            job.get("input", {}).get("imageUrls", []), 
            model_module.get_upsampling_model()
        )
        final_prompt = model_module.refine_prompt(params, img_ctx)
        img = model_module.run_inference(params, img_ctx, final_prompt)
        
        result_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{uuid.uuid4()}.png"
        img_payload = storage_module.prepare_image_payload(img)

        storage_module.upload_result_image(result_path, img_payload)
        
        model_result["resultPath"] = result_path
        model_result["status"] = "completed"
        message.ack()
    except Exception as error:
        logger.error(f"Error processing job {job_id}: {error}", exc_info=True)
        model_result["status"] = "error"
        model_result["error"] = str(error)
        message.nack()
    finally:
        mq_module.publish_status(model_result)
        reset_inactivity_timer()

if __name__ == "__main__":
    storage_module.download_models(MODEL_NAME)
    model_module.load_models_into_vram()

    reset_inactivity_timer()

    subscriber = mq_module.get_subscriber_client()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
    
    logger.info(f"Subscribed to: {sub_path}")
    
    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path, 
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=1)
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            logger.info("Shutdown signal received.")
            if inactivity_timer:
                inactivity_timer.cancel()
            streaming_pull.cancel()