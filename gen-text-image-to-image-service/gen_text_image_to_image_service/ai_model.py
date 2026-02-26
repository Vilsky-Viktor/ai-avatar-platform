import os
import torch
import random
from PIL import Image
from einops import rearrange
from flux2.openrouter_api_client import DEFAULT_SAMPLING_PARAMS, OpenRouterAPIClient
from flux2.sampling import (
    batched_prc_img, batched_prc_txt, denoise, denoise_cfg, 
    encode_image_refs, get_schedule, scatter_ids,
)
from flux2.util import FLUX2_MODEL_INFO, load_ae, load_flow_model, load_text_encoder
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)
DEVICE = torch.device("cuda")
MODELS = {}
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-klein-9b")

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

def get_upsampling_model():
    return MODELS["upsampling_model"]

def prepare_params(job_input):
    model_info = FLUX2_MODEL_INFO[MODEL_NAME]
    model_params = {
        "prompt": job_input.get("prompt", ""),
        "num_steps": int(job_input.get("numSteps", model_info.get("defaults", {}).get("num_steps", 13))),
        "guidance": float(job_input.get("guidance", model_info.get("defaults", {}).get("guidance", 1.0))),
        "width": int(job_input.get("width", 1360)),
        "height": int(job_input.get("height", 768)),
        "upsample_mode": job_input.get("upsample_prompt_mode", "none"),
        "openrouter_model": job_input.get("openrouter_model", "mistralai/pixtral-large-2411"),
        "model_info": model_info,
    }
    return model_params

def refine_prompt(params, img_ctx):
    upsampling_model = MODELS["upsampling_model"]
    prompt = params["prompt"]
    
    # if upsampling_model.test_txt(prompt):
    #     raise ValueError("Flagged Prompt Detected.")

    if params["upsample_mode"] == "openrouter" and os.getenv("OPENROUTER_API_KEY"):
        client = OpenRouterAPIClient(model=params["openrouter_model"], 
                                     sampling_params=DEFAULT_SAMPLING_PARAMS.get(params["openrouter_model"], {}))
        upsampled = client.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
        return upsampled[0] if upsampled else prompt
    
    if params["upsample_mode"] == "local":
        upsampled = upsampling_model.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
        return upsampled[0] if upsampled else prompt
        
    return prompt

def run_inference(params, reference_images, final_prompt):
    model_info = params["model_info"]
    seed = random.randint(0, 2**32 - 1)
    logger.info(f"use seed {seed}")

    with torch.no_grad():
        ref_tokens, ref_ids = encode_image_refs(MODELS["ae"], reference_images)
        
        if model_info["guidance_distilled"]:
            ctx = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
        else:
            ctx_empty = MODELS["text_encoder"]([""]).to(torch.bfloat16)
            ctx_prompt = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
            ctx = torch.cat([ctx_empty, ctx_prompt], dim=0)
        
        ctx, ctx_ids = batched_prc_txt(ctx)
        shape = (1, 128, params["height"] // 16, params["width"] // 16)
        generator = torch.Generator(device="cuda").manual_seed(seed)
        randn = torch.randn(shape, generator=generator, dtype=torch.bfloat16, device="cuda")
        x, x_ids = batched_prc_img(randn)
        timesteps = get_schedule(params["num_steps"], x.shape[1])

        denoise_fn = denoise if model_info["guidance_distilled"] else denoise_cfg
        x = denoise_fn(
            MODELS["flow_model"], x, x_ids, ctx, ctx_ids,
            timesteps=timesteps, guidance=params["guidance"],
            img_cond_seq=ref_tokens, img_cond_seq_ids=ref_ids
        )
        
        x = torch.cat(scatter_ids(x, x_ids)).squeeze(2)
        x = MODELS["ae"].decode(x).float()
        x = x.clamp(-1, 1)
        x = rearrange(x[0], "c h w -> h w c")
        img = Image.fromarray((127.5 * (x + 1.0)).cpu().byte().numpy())

    # if MODELS["upsampling_model"].test_image(img):
    #     raise ValueError("Output flagged by safety filter.")
    
    return img