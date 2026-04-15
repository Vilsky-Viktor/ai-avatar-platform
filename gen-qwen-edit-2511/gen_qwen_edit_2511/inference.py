import logging
import math
import os
import secrets
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

logging.getLogger("diffusers").setLevel(logging.ERROR)

logger = get_logger(__name__)

pipeline    = None
device      = None
# Maps adapter_name -> scale for currently loaded adapters.
# adapter_name is the LoRA path relative to /workspace (lora.path), used as stable identity.
_lora_cache: dict[str, float] = {}


@utils.timeit
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


def _adapter_name(path: str) -> str:
    """Sanitize a LoRA path into a valid PEFT/PyTorch module name (no dots or slashes)."""
    return path.replace("/", "__").replace(".", "_")


@utils.timeit
def sync_loras(loras: list[LoraConfig]):
    """Diff incoming LoRAs against the cache: unload stale, update scales, load new."""
    global _lora_cache

    incoming: dict[str, float] = {lora.path: lora.scale for lora in loras}

    to_remove  = [path for path in _lora_cache if path not in incoming]
    to_update  = [path for path in _lora_cache if path in incoming and incoming[path] != _lora_cache[path]]
    to_load    = [lora for lora in loras if lora.path not in _lora_cache]

    if not to_remove and not to_update and not to_load:
        logger.info("LoRA cache hit — all adapters already loaded with correct scales")
        return

    if to_remove:
        logger.info(f"Removing {len(to_remove)} stale LoRA(s): {[Path(n).name for n in to_remove]}")
        pipeline.delete_adapters([_adapter_name(p) for p in to_remove])
        for path in to_remove:
            del _lora_cache[path]

    for lora in to_load:
        local_path = str(Path("/workspace") / lora.path)
        adapter_name = _adapter_name(lora.path)
        logger.info(f"  [load] {Path(lora.path).name} scale={lora.scale}")
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=RuntimeWarning, module="peft")
            warnings.filterwarnings("ignore", category=UserWarning, module="peft")
            pipeline.load_lora_weights(local_path, adapter_name=adapter_name, weight_name=lora.filename)
        _lora_cache[lora.path] = lora.scale

    if to_update:
        logger.info(f"Updating scale for {len(to_update)} LoRA(s): {[Path(n).name for n in to_update]}")
        for path in to_update:
            _lora_cache[path] = incoming[path]

    # Apply all current adapter names and their scales in job-defined order
    active_names  = [_adapter_name(lora.path) for lora in loras]
    active_scales = [lora.scale for lora in loras]
    pipeline.set_adapters(active_names, adapter_weights=active_scales)
    logger.info(f"LoRAs synced — {len(active_names)} active: {[Path(lora.path).name for lora in loras]}")


@utils.timeit
def clear_loras():
    """Full LoRA teardown — used on error to ensure clean state for next job."""
    global _lora_cache
    if not _lora_cache:
        return
    try:
        pipeline.delete_adapters([_adapter_name(p) for p in _lora_cache])
        pipeline.unload_lora_weights()
        _lora_cache = {}
        logger.info("LoRAs fully cleared")
    except Exception as e:
        logger.warning(f"Failed to clear LoRAs: {e}")



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
    if not images:
        images = [Image.new("RGB", (job_input.inference.width, job_input.inference.height), (255, 255, 255))]

    seed = job_input.inference.seed or secrets.randbelow(2**32)
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
