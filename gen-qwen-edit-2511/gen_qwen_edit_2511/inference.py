import os
import secrets
from pathlib import Path

import torch
from diffusers import QwenImageEditPlusPipeline
from PIL import Image

from gen_qwen_edit_2511.logger import get_logger
from gen_qwen_edit_2511.models import JobInput, LoraConfig
import gen_qwen_edit_2511.utils as utils


QWEN_MODEL_PATH = os.getenv("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")

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
        logger.info(f"  [{adapter_name}] {lora.path} filename={lora.filename} scale={lora.scale}")
        pipeline.load_lora_weights(local_path, adapter_name=adapter_name, weight_name=lora.filename)

    adapter_names = [f"lora_{i}" for i in range(len(loras))]
    scales = [lora.scale for lora in loras]
    pipeline.set_adapters(adapter_names, adapter_weights=scales)
    logger.info("LoRAs loaded and activated")


def unload_loras():
    pipeline.unload_lora_weights()
    logger.info("LoRAs unloaded")



BUCKET_SIZE = 1_000_000

def _generate_bucketed_seed(run_num: int) -> int:
    return secrets.randbelow(BUCKET_SIZE) + (run_num * BUCKET_SIZE)


@utils.timeit
def run_inference(job_input: JobInput, images: list[Image.Image], num_inference_steps: int, seed, width: int, height: int, run_num: int = 0):
    seed = seed if seed is not None else _generate_bucketed_seed(run_num)
    generator = torch.Generator(device=device).manual_seed(seed)

    with torch.no_grad():
        img = pipeline(
            image=images,
            prompt=job_input.prompt,
            negative_prompt=job_input.negativePrompt if job_input.negativePrompt else " ",
            height=height,
            width=width,
            generator=generator,
            true_cfg_scale=job_input.inference.trueCfgScale,
            num_inference_steps=num_inference_steps,
        ).images[0]

    return img, seed
