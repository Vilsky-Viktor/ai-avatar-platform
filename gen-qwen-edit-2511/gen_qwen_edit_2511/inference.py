import math
import os
import warnings
from pathlib import Path

import torch
from diffusers import QwenImageEditPlusPipeline
from PIL import Image

from gen_qwen_edit_2511.logger import get_logger
from gen_qwen_edit_2511.models import JobInput, LoraConfig
import gen_qwen_edit_2511.utils as utils


QWEN_MODEL_PATH      = os.getenv("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")
CONDITION_IMAGE_SIZE = 384 * 384

logger = get_logger(__name__)

pipeline = None
device   = None


def load_pipeline():
    global pipeline, device

    logger.info("Loading Qwen Image Edit 2511 pipeline ...")
    device = "cuda"

    pipeline = QwenImageEditPlusPipeline.from_pretrained(
        QWEN_MODEL_PATH,
        torch_dtype=torch.bfloat16,
        low_cpu_mem_usage=True,
    )

    logger.info("Loading model into VRAM ...")
    pipeline.to(device=device)
    logger.info("Model loaded into VRAM")

    pipeline.set_progress_bar_config(disable=True)
    logger.info("Pipeline ready")


def clear_cache():
    torch.cuda.empty_cache()


def load_loras(loras: list[LoraConfig]):
    logger.info(f"Loading {len(loras)} LoRA(s) ...")
    for i, lora in enumerate(loras):
        adapter_name = f"lora_{i}"
        local_path = str(Path("/workspace") / lora.path)
        logger.info(f"  [{adapter_name}] {Path(lora.path).name} filename={lora.filename} scale={lora.scale}")
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=RuntimeWarning, module="peft")
            pipeline.load_lora_weights(local_path, adapter_name=adapter_name, weight_name=lora.filename)

    adapter_names = [f"lora_{i}" for i in range(len(loras))]
    scales = [lora.scale for lora in loras]
    pipeline.set_adapters(adapter_names, adapter_weights=scales)
    logger.info("LoRAs loaded and activated")


def unload_loras():
    try:
        pipeline.unload_lora_weights()
        logger.info("LoRAs unloaded")
    except Exception as e:
        logger.warning(f"Failed to unload LoRAs cleanly: {e}")



def _resize_images_for_condition(images: list[Image.Image]) -> list[Image.Image]:
    result = []
    for img in images:
        w, h = img.size
        ratio = w / h
        target_w = math.sqrt(CONDITION_IMAGE_SIZE * ratio)
        target_h = target_w / ratio
        target_w = round(target_w / 32) * 32
        target_h = round(target_h / 32) * 32
        result.append(pipeline.image_processor.resize(img, int(target_h), int(target_w)))
    return result


def _build_expression_embeds(job_input: JobInput, images: list[Image.Image]):
    expression = job_input.faceExpression.type
    scale = job_input.faceExpression.scale
    context = job_input.inference.prompt

    prompt_tgt = f"Edit the person to show a {expression} expression. {context}".strip()
    prompt_neu = f"Edit the person to show a neutral expression. {context}".strip()

    # Pipeline resizes images to condition size before encode_prompt — we must do the same
    # so image token count matches what the pipeline will use during denoising.
    condition_images = _resize_images_for_condition(images)

    with torch.no_grad():
        embed_tgt, mask_tgt = pipeline.encode_prompt(
            prompt=prompt_tgt,
            image=condition_images,
            device=device,
            num_images_per_prompt=1,
        )
        embed_neu, _ = pipeline.encode_prompt(
            prompt=prompt_neu,
            image=condition_images,
            device=device,
            num_images_per_prompt=1,
        )

    prompt_embeds = embed_neu + scale * (embed_tgt - embed_neu)

    # encode_prompt sets mask to None when all tokens are attended (optimization).
    # pipeline.__call__ requires the mask explicitly when prompt_embeds are provided.
    if mask_tgt is None:
        mask_tgt = torch.ones(prompt_embeds.shape[:2], dtype=torch.long, device=prompt_embeds.device)

    return prompt_embeds, mask_tgt


@utils.timeit
def run_inference(job_input: JobInput, images: list[Image.Image]):
    seed = job_input.inference.seed or torch.randint(0, 2**32 - 1, (1,)).item()
    generator = torch.Generator(device=device).manual_seed(seed)

    logger.info(f"Using seed {seed}")

    with torch.no_grad():
        if job_input.faceExpression.enabled:
            prompt_embeds, prompt_embeds_mask = _build_expression_embeds(job_input, images)
            img = pipeline(
                image=images,
                prompt_embeds=prompt_embeds,
                prompt_embeds_mask=prompt_embeds_mask,
                height=job_input.inference.height,
                width=job_input.inference.width,
                generator=generator,
                true_cfg_scale=0,
                num_inference_steps=job_input.inference.numSteps,
            ).images[0]
        else:
            img = pipeline(
                image=images,
                prompt=job_input.inference.prompt,
                negative_prompt=job_input.inference.negativePrompt if job_input.inference.negativePrompt or job_input.inference.guidanceScale > 1 else None,
                height=job_input.inference.height,
                width=job_input.inference.width,
                generator=generator,
                true_cfg_scale=job_input.inference.guidanceScale,
                num_inference_steps=job_input.inference.numSteps,
            ).images[0]

    return img, seed
