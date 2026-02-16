import os
import json
import torch
import random
import uuid
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

# Configuration
PROJECT_ID = os.getenv("PROJECT_ID", "loom24-mvp")
SUBSCRIPTION_ID = os.getenv("SUBSCRIPTION_ID", "generate-text-image-to-image-sub")
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")
BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"
DEVICE = torch.device("cuda")

MODELS = {}

def load_models_into_vram():
    print(f"--- Loading {MODEL_NAME} into VRAM ---")
    MODELS["text_encoder"] = load_text_encoder(MODEL_NAME, device=DEVICE)
    
    if "klein" in MODEL_NAME:
        MODELS["upsampling_model"] = load_text_encoder("flux.2-dev")
    else:
        MODELS["upsampling_model"] = MODELS["text_encoder"]
    
    MODELS["flow_model"] = load_flow_model(MODEL_NAME, device=DEVICE)
    MODELS["ae"] = load_ae(MODEL_NAME).to(DEVICE)
    
    for m in MODELS.values():
        if hasattr(m, 'eval'): m.eval()
    print("--- Model Loading Complete ---")

def download_models():
    remote_prefix = f"{BUCKET_MODELS_PATH}/{MODEL_NAME}/"
    local_base_dir = Path(LOCAL_MODELS_PATH)

    print(f"--- Syncing {MODEL_NAME} from bucket: {BUCKET_NAME} ---")
    
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)

    blobs = list(bucket.list_blobs(prefix=remote_prefix))
    
    if not blobs:
        print(f"Error: No blobs found for {remote_prefix}")
        return

    for blob in blobs:
        if blob.name.endswith('/'):
            continue

        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists():
            if final_dest.stat().st_size == blob.size:
                print(f"Skipping (already exists): {relative_path}")
                continue
            else:
                print(f"File size mismatch for {relative_path}. Re-downloading...")

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"Downloading: {blob.name} -> {final_dest}")
        blob.download_to_filename(str(final_dest))

    print(f"--- Sync for {MODEL_NAME} complete ---")

def process_job(message: pubsub_v1.subscriber.message.Message):
    try:
        job = json.loads(message.data.decode("utf-8"))
        print(f"Received job {json.dumps(job)}")
        job_input = job.get("input", {})
        model_info = FLUX2_MODEL_INFO[MODEL_NAME]
        
        # 1. Basic Parameter Extraction
        prompt = job_input.get("prompt", "")
        num_steps = int(job_input.get("numSteps", model_info.get("defaults", {}).get("num_steps", 50)))
        guidance = float(job_input.get("guidance", model_info.get("defaults", {}).get("guidance", 4.0)))
        width = int(job_input.get("width", 1360))
        height = int(job_input.get("height", 768))
        seed = job_input.get("seed") if job_input.get("seed") is not None else random.randrange(2**31)
        
        # New CLI features: match_image_size and upsample mode
        match_image_size = job_input.get("match_image_size") # index
        upsample_mode = job_input.get("upsample_prompt_mode", "none") # none, local, openrouter
        openrouter_model = job_input.get("openrouter_model", "mistralai/pixtral-large-2411")

        # 2. Safety Check (Input Prompt)
        if MODELS["upsampling_model"].test_txt(prompt):
            print("Flagged Prompt Detected.")
            message.ack()
            return

        # 3. Handle Input Images
        input_image_paths = job_input.get("imageUrls", [])
        img_ctx = []
        for p in input_image_paths:
            if os.path.exists(p):
                # Safety Check (Input Image)
                if MODELS["upsampling_model"].test_image(p):
                    print(f"Flagged Input Image: {p}")
                    continue
                img_ctx.append(Image.open(p).convert("RGB"))

        # 4. Dimension Matching (From CLI Logic)
        if match_image_size is not None and 0 <= match_image_size < len(img_ctx):
            width, height = img_ctx[match_image_size].size
            print(f"Matched dimensions from image {match_image_size}: {width}x{height}")

        # 5. Prompt Upsampling
        final_prompt = prompt
        if upsample_mode == "openrouter" and os.getenv("OPENROUTER_API_KEY"):
            client = OpenRouterAPIClient(model=openrouter_model, sampling_params=DEFAULT_SAMPLING_PARAMS.get(openrouter_model, {}))
            upsampled = client.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
            final_prompt = upsampled[0] if upsampled else prompt
        elif upsample_mode == "local":
            upsampled = MODELS["upsampling_model"].upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
            final_prompt = upsampled[0] if upsampled else prompt

        # 6. Inference
        with torch.no_grad():
            # Image Conditioning
            ref_tokens, ref_ids = encode_image_refs(MODELS["ae"], img_ctx)

            # Text Encoding
            if model_info["guidance_distilled"]:
                ctx = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
            else:
                ctx_empty = MODELS["text_encoder"]([""]).to(torch.bfloat16)
                ctx_prompt = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
                ctx = torch.cat([ctx_empty, ctx_prompt], dim=0)
            ctx, ctx_ids = batched_prc_txt(ctx)

            # Latent Setup
            shape = (1, 128, height // 16, width // 16)
            generator = torch.Generator(device="cuda").manual_seed(seed)
            randn = torch.randn(shape, generator=generator, dtype=torch.bfloat16, device="cuda")
            x, x_ids = batched_prc_img(randn)
            timesteps = get_schedule(num_steps, x.shape[1])

            # Denoise
            denoise_fn = denoise if model_info["guidance_distilled"] else denoise_cfg
            x = denoise_fn(
                MODELS["flow_model"], x, x_ids, ctx, ctx_ids,
                timesteps=timesteps, guidance=guidance,
                img_cond_seq=ref_tokens, img_cond_seq_ids=ref_ids
            )
            
            # Decode
            x = torch.cat(scatter_ids(x, x_ids)).squeeze(2)
            x = MODELS["ae"].decode(x).float()
            x = x.clamp(-1, 1)
            x = rearrange(x[0], "c h w -> h w c")

            img = Image.fromarray((127.5 * (x + 1.0)).cpu().byte().numpy())

        # 7. Final Safety Check & Save with EXIF
        if MODELS["upsampling_model"].test_image(img):
            print("Output flagged by safety filter.")
        else:
            exif_data = Image.Exif()
            exif_data[ExifTags.Base.Software] = "AI generated;flux2"
            exif_data[ExifTags.Base.Make] = "Black Forest Labs"
            
            out_path = Path("outputs") / f"out_{uuid.uuid4()}.png"
            out_path.parent.mkdir(exist_ok=True)
            img.save(out_path, exif=exif_data, quality=95, subsampling=0)
            print(f"Job Complete: {out_path}")

        message.ack()

    except Exception as e:
        print(f"Error: {e}")
        message.nack()

if __name__ == "__main__":
    download_models()
    load_models_into_vram()

    subscriber = pubsub_v1.SubscriberClient()
    sub_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
    
    print("Subscribe to topic")
    print(sub_path)
    
    with subscriber:
        streaming_pull = subscriber.subscribe(
            sub_path, 
            callback=process_job,
            flow_control=pubsub_v1.types.FlowControl(max_messages=1)
        )
        try:
            streaming_pull.result()
        except KeyboardInterrupt:
            streaming_pull.cancel()