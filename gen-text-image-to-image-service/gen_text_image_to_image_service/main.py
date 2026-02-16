import os
import json
import torch
import random
import uuid
import io
import logging
from datetime import datetime
from pathlib import Path
from google.cloud import pubsub_v1
from google.cloud import storage
from PIL import ExifTags, Image
from einops import rearrange

from flux2.openrouter_api_client import DEFAULT_SAMPLING_PARAMS, OpenRouterAPIClient
from flux2.sampling import (
    batched_prc_img,
    batched_prc_txt,
    denoise,
    denoise_cfg,
    encode_image_refs,
    get_schedule,
    scatter_ids,
)
from flux2.util import FLUX2_MODEL_INFO, load_ae, load_flow_model, load_text_encoder

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
RESULT_TOPIC_ID = os.getenv("RESULT_TOPIC_ID", "ai-model-result")
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")
BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"
DEVICE = torch.device("cuda")

storage_client = storage.Client()
publisher = pubsub_v1.PublisherClient()
result_topic_path = publisher.topic_path(PROJECT_ID, RESULT_TOPIC_ID)

MODELS = {}

def load_models_into_vram():
    logger.info(f"Loading {MODEL_NAME} into VRAM")
    MODELS["text_encoder"] = load_text_encoder(MODEL_NAME, device=DEVICE)
    
    if "klein" in MODEL_NAME:
        MODELS["upsampling_model"] = load_text_encoder("flux.2-dev")
    else:
        MODELS["upsampling_model"] = MODELS["text_encoder"]
    
    MODELS["flow_model"] = load_flow_model(MODEL_NAME, device=DEVICE)
    MODELS["ae"] = load_ae(MODEL_NAME).to(DEVICE)
    
    for m in MODELS.values():
        if hasattr(m, 'eval'): m.eval()
    logger.info("Model Loading Complete")

def download_models():
    remote_prefix = f"{BUCKET_MODELS_PATH}/{MODEL_NAME}/"
    local_base_dir = Path(LOCAL_MODELS_PATH)
    logger.info(f"Syncing {MODEL_NAME} from bucket: {BUCKET_NAME}")
    
    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=remote_prefix))
    
    if not blobs:
        logger.error(f"No blobs found for {remote_prefix}")
        return

    for blob in blobs:
        if blob.name.endswith('/'): continue
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists() and final_dest.stat().st_size == blob.size:
            continue

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(final_dest))
    logger.info(f"Sync for {MODEL_NAME} complete")

def publish_status(result_payload):
    """Utility to send results back to the Pub/Sub result topic."""
    try:
        data = json.dumps(result_payload).encode("utf-8")
        future = publisher.publish(result_topic_path, data=data)
        logger.info(f"Result published: {future.result()}")
    except Exception as e:
        logger.error(f"Failed to publish result to Pub/Sub: {e}")

def process_job(message: pubsub_v1.subscriber.message.Message):
    job = json.loads(message.data.decode("utf-8"))
    job_id = job.get("id", "unknown")
    logger.info(f"Processing job: {job_id}")
    
    job_input = job.get("input", {})
    model_info = FLUX2_MODEL_INFO[MODEL_NAME]

    user_id = job.get("userId", "")
    avatar_id = job.get("avatarId", "")
    job_type = job.get("type", "")

    model_result = {
        "userId": user_id,
        "avatarId": avatar_id,
        "jobId": job_id,
        "type": job_type,
        "resultPath": None,
        "error": None
    }
    
    try:
        prompt = job_input.get("prompt", "")
        num_steps = int(job_input.get("numSteps", model_info.get("defaults", {}).get("num_steps", 50)))
        guidance = float(job_input.get("guidance", model_info.get("defaults", {}).get("guidance", 4.0)))
        width = int(job_input.get("width", 1360))
        height = int(job_input.get("height", 768))
        seed = job_input.get("seed") if job_input.get("seed") is not None else random.randrange(2**31)
        upsample_mode = job_input.get("upsample_prompt_mode", "none")
        openrouter_model = job_input.get("openrouter_model", "mistralai/pixtral-large-2411")

        if MODELS["upsampling_model"].test_txt(prompt):
            raise ValueError("Flagged Prompt Detected.")

        input_image_paths = job_input.get("imageUrls", [])
        img_ctx = []
        for p in input_image_paths:
            if os.path.exists(p):
                if MODELS["upsampling_model"].test_image(p):
                    continue
                img_ctx.append(Image.open(p).convert("RGB"))

        final_prompt = prompt
        if upsample_mode == "openrouter" and os.getenv("OPENROUTER_API_KEY"):
            client = OpenRouterAPIClient(model=openrouter_model, sampling_params=DEFAULT_SAMPLING_PARAMS.get(openrouter_model, {}))
            upsampled = client.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
            final_prompt = upsampled[0] if upsampled else prompt
        elif upsample_mode == "local":
            upsampled = MODELS["upsampling_model"].upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
            final_prompt = upsampled[0] if upsampled else prompt

        with torch.no_grad():
            ref_tokens, ref_ids = encode_image_refs(MODELS["ae"], img_ctx)
            
            if model_info["guidance_distilled"]:
                ctx = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
            else:
                ctx_empty = MODELS["text_encoder"]([""]).to(torch.bfloat16)
                ctx_prompt = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
                ctx = torch.cat([ctx_empty, ctx_prompt], dim=0)
            
            ctx, ctx_ids = batched_prc_txt(ctx)
            shape = (1, 128, height // 16, width // 16)
            generator = torch.Generator(device="cuda").manual_seed(seed)
            randn = torch.randn(shape, generator=generator, dtype=torch.bfloat16, device="cuda")
            x, x_ids = batched_prc_img(randn)
            timesteps = get_schedule(num_steps, x.shape[1])

            denoise_fn = denoise if model_info["guidance_distilled"] else denoise_cfg
            x = denoise_fn(
                MODELS["flow_model"], x, x_ids, ctx, ctx_ids,
                timesteps=timesteps, guidance=guidance,
                img_cond_seq=ref_tokens, img_cond_seq_ids=ref_ids
            )
            
            x = torch.cat(scatter_ids(x, x_ids)).squeeze(2)
            x = MODELS["ae"].decode(x).float()
            x = x.clamp(-1, 1)
            x = rearrange(x[0], "c h w -> h w c")
            img = Image.fromarray((127.5 * (x + 1.0)).cpu().byte().numpy())

        if MODELS["upsampling_model"].test_image(img):
            raise ValueError("Output flagged by safety filter.")

        exif_data = Image.Exif()
        exif_data[ExifTags.Base.Software] = "AI generated"
        exif_data[ExifTags.Base.Make] = "Loom24.ai"

        result_media_path = f"media/{user_id}-user/avatars/{avatar_id}-avatar/images/{uuid.uuid4()}.png"
        
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(result_media_path)
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG', exif=exif_data)
        img_byte_arr.seek(0)
        
        blob.upload_from_file(img_byte_arr, content_type="image/png")
        
        model_result["resultPath"] = result_media_path
        logger.info(f"Job Complete. Image uploaded to {result_media_path}")
        message.ack()

    except Exception as error:
        logger.error(f"Error processing job {job_id}: {error}", exc_info=True)
        model_result["error"] = str(error)
        message.nack()

    finally:
        publish_status(model_result)

if __name__ == "__main__":
    download_models()
    load_models_into_vram()

    subscriber = pubsub_v1.SubscriberClient()
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
            logger.info("Shutdown signal received. Cancelling streaming pull...")
            streaming_pull.cancel()