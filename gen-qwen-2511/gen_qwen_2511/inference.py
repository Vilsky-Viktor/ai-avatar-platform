import os
import secrets
from pathlib import Path

import torch
from torchao.quantization import quantize_, Float8DynamicActivationFloat8WeightConfig, PerRow
from diffusers import QwenImageEditPlusPipeline
from PIL import Image
from gen_qwen_2511.logger import get_logger
import gen_qwen_2511.utils as utils


QWEN_MODEL_PATH = os.getenv("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")
WARMUP_RESOLUTIONS = [(1024, 1024)]
WARMUP_STEPS = int(os.getenv("WARMUP_STEPS", "20"))
# Choose precision: "bf16" or "fp8"
MODEL_PRECISION = os.getenv("MODEL_PRECISION", "bf16")
USE_MODEL_COMPILATION = os.getenv("USE_MODEL_COMPILATION", "true").lower() == "true"

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

    if MODEL_PRECISION == "fp8":
        logger.info("Applying FP8 quantization to transformer ...")
        try:
            quantize_(pipeline.transformer, Float8DynamicActivationFloat8WeightConfig(granularity=PerRow()))
            logger.info("FP8 quantization applied")
        except Exception as e:
            logger.warning(f"FP8 quantization failed, falling back to bf16: {e}")

    if USE_MODEL_COMPILATION:
        logger.info("Applying torch.compile to transformer blocks ...")
        try:
            transformer_blocks = pipeline.transformer.transformer_blocks
            single_blocks = getattr(pipeline.transformer, "single_transformer_blocks", [])
            total_blocks = len(transformer_blocks) + len(single_blocks)
            torch._dynamo.config.recompile_limit = total_blocks + 10
            compile_kwargs = dict(
                dynamic=True,
                options={
                    "max_autotune": True,
                    "max_autotune_gemm": True,
                    "triton.cudagraphs": False,
                    "epilogue_fusion": True,
                    "shape_padding": True,
                },
            )
            for i in range(len(transformer_blocks)):
                pipeline.transformer.transformer_blocks[i] = torch.compile(
                    pipeline.transformer.transformer_blocks[i], **compile_kwargs
                )
            for i in range(len(single_blocks)):
                pipeline.transformer.single_transformer_blocks[i] = torch.compile(
                    pipeline.transformer.single_transformer_blocks[i], **compile_kwargs
                )
            logger.info(f"Compiled {total_blocks} transformer blocks")
        except AttributeError as e:
            logger.warning(f"torch.compile skipped — transformer block structure not accessible: {e}")

    pipeline.set_progress_bar_config(disable=True)


def clear_cache():
    torch.cuda.empty_cache()


def load_loras(loras: list[dict]):
    """Load and activate a list of LoRA adapters with their scales.

    Each entry must have ``path`` (local absolute path) and ``scale`` (float).
    """
    logger.info(f"Loading {len(loras)} LoRA(s) ...")
    for i, lora in enumerate(loras):
        adapter_name = f"lora_{i}"
        local_path = str(Path("/workspace") / lora["path"])
        logger.info(f"  [{adapter_name}] {lora['path']} scale={lora['scale']}")
        pipeline.load_lora_weights(local_path, adapter_name=adapter_name)

    adapter_names = [f"lora_{i}" for i in range(len(loras))]
    scales = [float(lora["scale"]) for lora in loras]
    pipeline.set_adapters(adapter_names, adapter_weights=scales)
    logger.info("LoRAs loaded and activated")


def unload_loras():
    """Detach all LoRA adapters from the pipeline."""
    pipeline.unload_lora_weights()
    logger.info("LoRAs unloaded")


def _warmup_single(height: int, width: int, images: list):
    pipeline(
        image=images,
        prompt="Keep exact facial identity and proportions from reference image. Front close-up headshot ID photo. Wearing white t-shirt. Soft diffused studio lighting. Plain light gray background. Hyperrealistic photograph, 8K detail. Sharp focus on face",
        negative_prompt=" ",
        height=height,
        width=width,
        generator=torch.Generator(device=device).manual_seed(0),
        guidance_scale=1.0,
        true_cfg_scale=4.0,
        num_inference_steps=WARMUP_STEPS,
    )


def warmup(images: list):
    logger.info("Warming up pipeline (compiling kernels) ...")
    with torch.no_grad():
        for height, width in WARMUP_RESOLUTIONS:
            logger.info(f"Warming up {width}x{height} ...")
            _warmup_single(height, width, images)
    logger.info("Warmup complete")


BUCKET_SIZE = 1_000_000

def _generate_bucketed_seed(run_num: int) -> int:
    return secrets.randbelow(BUCKET_SIZE) + (run_num * BUCKET_SIZE)


@utils.timeit
def run_inference(params: dict, images: list[Image.Image], num_inference_steps, seed, width, height, run_num: int = 0):
    prompt = params.get("prompt")
    negative_prompt = params.get("negativePrompt", " ")
    guidance_scale = params.get("inference", {}).get("guidance", 1.0)
    true_cfg_scale = params.get("inference", {}).get("trueCfgScale", 4.0)
    seed = seed if seed is not None else _generate_bucketed_seed(run_num)

    generator = torch.Generator(device=device).manual_seed(seed)

    with torch.no_grad():
        img = pipeline(
            image=images,
            prompt=prompt,
            negative_prompt=negative_prompt,
            height=height,
            width=width,
            generator=generator,
            guidance_scale=guidance_scale,
            true_cfg_scale=true_cfg_scale,
            num_inference_steps=num_inference_steps,
        ).images[0]

    return img, seed
