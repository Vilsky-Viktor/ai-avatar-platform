import os
import torch
from pathlib import Path
from typing import Optional

from diffusers import FlowMatchEulerDiscreteScheduler
from omegaconf import OmegaConf

from .videox_fun.dist import set_multi_gpus_devices
from .videox_fun.models import (
    AutoencoderKLWan,
    AutoencoderKLWan3_8,
    AutoTokenizer,
    WanT5EncoderModel,
    Wan2_2Transformer3DModel,
)
from .videox_fun.models.cache_utils import get_teacache_coefficients
from .videox_fun.pipeline import Wan2_2FunInpaintPipeline
from .videox_fun.utils.fp8_optimization import (
    convert_model_weight_to_float8,
    replace_parameters_by_name,
    convert_weight_dtype_wrapper,
)
from .videox_fun.utils.lora_utils import merge_lora, unmerge_lora
from .videox_fun.utils.utils import (
    filter_kwargs,
    get_image_to_video_latent,
    save_videos_grid,
)
from .videox_fun.utils.fm_solvers import FlowDPMSolverMultistepScheduler
from .videox_fun.utils.fm_solvers_unipc import FlowUniPCMultistepScheduler
from .models import Job
from .logger import get_logger
import gen_wan_22_ti2v.storage as storage

logger = get_logger(__name__)

LOCAL_MODELS_PATH = os.environ.get("LOCAL_MODELS_PATH", "/workspace/models")
LOCAL_LORAS_PATH = os.environ.get("LOCAL_LORAS_PATH", "/workspace/loras")

INP_MODEL_NAME = os.environ.get("INP_MODEL_NAME", "wan-22/wan2.2-fun-a14b-inp")

GPU_MEMORY_MODE = os.environ.get("GPU_MEMORY_MODE", "sequential_cpu_offload")
WEIGHT_DTYPE = torch.bfloat16

TEACACHE_ENABLED = os.environ.get("TEACACHE_ENABLED", "true").lower() == "true"
TEACACHE_THRESHOLD_T2V = float(os.environ.get("TEACACHE_THRESHOLD_T2V", "0.10"))
TEACACHE_THRESHOLD_I2V = float(os.environ.get("TEACACHE_THRESHOLD_I2V", "0.15"))
TEACACHE_SKIP_STEPS = int(os.environ.get("TEACACHE_SKIP_STEPS", "5"))

_device: Optional[str] = None
_pipeline: Optional[Wan2_2FunInpaintPipeline] = None
_vae = None
_config = None


def _get_device() -> str:
    global _device
    if _device is None:
        _device = set_multi_gpus_devices(1, 1)
    return _device


def _load_config(model_path: str):
    config_path = os.path.join(model_path, "config.yaml")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Model config not found at {config_path}.")
    return OmegaConf.load(config_path)


def _load_transformers(model_path: str, config):
    low_noise_subpath = config["transformer_additional_kwargs"].get(
        "transformer_low_noise_model_subpath", "transformer"
    )
    transformer = Wan2_2Transformer3DModel.from_pretrained(
        os.path.join(model_path, low_noise_subpath),
        transformer_additional_kwargs=OmegaConf.to_container(config["transformer_additional_kwargs"]),
        low_cpu_mem_usage=True,
        torch_dtype=WEIGHT_DTYPE,
    )
    transformer_2 = None
    if config["transformer_additional_kwargs"].get("transformer_combination_type", "single") == "moe":
        high_noise_subpath = config["transformer_additional_kwargs"].get(
            "transformer_high_noise_model_subpath", "transformer_2"
        )
        transformer_2 = Wan2_2Transformer3DModel.from_pretrained(
            os.path.join(model_path, high_noise_subpath),
            transformer_additional_kwargs=OmegaConf.to_container(config["transformer_additional_kwargs"]),
            low_cpu_mem_usage=True,
            torch_dtype=WEIGHT_DTYPE,
        )
    return transformer, transformer_2


def _load_vae(model_path: str, config):
    vae_type = config["vae_kwargs"].get("vae_type", "AutoencoderKLWan")
    VAEClass = {"AutoencoderKLWan": AutoencoderKLWan, "AutoencoderKLWan3_8": AutoencoderKLWan3_8}[vae_type]
    return VAEClass.from_pretrained(
        os.path.join(model_path, config["vae_kwargs"].get("vae_subpath", "vae")),
        additional_kwargs=OmegaConf.to_container(config["vae_kwargs"]),
    ).to(WEIGHT_DTYPE)


def _load_text_components(model_path: str, config):
    tokenizer = AutoTokenizer.from_pretrained(
        os.path.join(model_path, config["text_encoder_kwargs"].get("tokenizer_subpath", "tokenizer")),
    )
    text_encoder = WanT5EncoderModel.from_pretrained(
        os.path.join(model_path, config["text_encoder_kwargs"].get("text_encoder_subpath", "text_encoder")),
        additional_kwargs=OmegaConf.to_container(config["text_encoder_kwargs"]),
        low_cpu_mem_usage=True,
        torch_dtype=WEIGHT_DTYPE,
    ).eval()
    return tokenizer, text_encoder


def _load_scheduler(config):
    scheduler_kwargs = OmegaConf.to_container(config["scheduler_kwargs"])
    return FlowMatchEulerDiscreteScheduler(**filter_kwargs(FlowMatchEulerDiscreteScheduler, scheduler_kwargs))


def _apply_memory_mode(pipeline, transformer, transformer_2, device: str):
    if GPU_MEMORY_MODE == "sequential_cpu_offload":
        replace_parameters_by_name(transformer, ["modulation"], device=device)
        transformer.freqs = transformer.freqs.to(device=device)
        if transformer_2 is not None:
            replace_parameters_by_name(transformer_2, ["modulation"], device=device)
            transformer_2.freqs = transformer_2.freqs.to(device=device)
        pipeline.enable_sequential_cpu_offload(device=device)
    elif GPU_MEMORY_MODE == "model_cpu_offload_and_qfloat8":
        convert_model_weight_to_float8(transformer, exclude_module_name=["modulation"], device=device)
        convert_weight_dtype_wrapper(transformer, WEIGHT_DTYPE)
        if transformer_2 is not None:
            convert_model_weight_to_float8(transformer_2, exclude_module_name=["modulation"], device=device)
            convert_weight_dtype_wrapper(transformer_2, WEIGHT_DTYPE)
        pipeline.enable_model_cpu_offload(device=device)
    elif GPU_MEMORY_MODE == "model_cpu_offload":
        pipeline.enable_model_cpu_offload(device=device)
    elif GPU_MEMORY_MODE == "model_full_load_and_qfloat8":
        convert_model_weight_to_float8(transformer, exclude_module_name=["modulation"], device=device)
        convert_weight_dtype_wrapper(transformer, WEIGHT_DTYPE)
        if transformer_2 is not None:
            convert_model_weight_to_float8(transformer_2, exclude_module_name=["modulation"], device=device)
            convert_weight_dtype_wrapper(transformer_2, WEIGHT_DTYPE)
        pipeline.to(device=device)
    else:
        pipeline.to(device=device)


def _setup_teacache(pipeline, transformer_2, model_path: str, threshold: float, num_steps: int):
    if not TEACACHE_ENABLED:
        return
    coefficients = get_teacache_coefficients(model_path)
    if coefficients is None:
        return
    logger.info(f"TeaCache enabled: threshold={threshold}, skip_steps={TEACACHE_SKIP_STEPS}")
    pipeline.transformer.enable_teacache(
        coefficients, num_steps, threshold,
        num_skip_start_steps=TEACACHE_SKIP_STEPS,
        offload=False,
    )
    if transformer_2 is not None:
        pipeline.transformer_2.share_teacache(transformer=pipeline.transformer)


def _get_pipeline(num_steps: int) -> tuple:
    global _pipeline, _vae, _config
    if _pipeline is None:
        logger.info(f"Loading InP pipeline from {INP_MODEL_NAME}")
        device = _get_device()
        model_path = os.path.join(LOCAL_MODELS_PATH, INP_MODEL_NAME)
        _config = _load_config(model_path)

        transformer, transformer_2 = _load_transformers(model_path, _config)
        _vae = _load_vae(model_path, _config)
        tokenizer, text_encoder = _load_text_components(model_path, _config)
        scheduler = _load_scheduler(_config)

        _pipeline = Wan2_2FunInpaintPipeline(
            transformer=transformer,
            transformer_2=transformer_2,
            vae=_vae,
            tokenizer=tokenizer,
            text_encoder=text_encoder,
            scheduler=scheduler,
        )
        _apply_memory_mode(_pipeline, transformer, transformer_2, device)
        _setup_teacache(_pipeline, transformer_2, model_path, TEACACHE_THRESHOLD_T2V, num_steps)
        logger.info("InP pipeline ready")

    return _pipeline, _vae, _config


def _merge_all_loras(pipeline, loras, device: str, transformer_2) -> list:
    merged = []
    for lora in loras:
        local_dir = Path(LOCAL_LORAS_PATH) / lora.path
        lora_file = str(local_dir / lora.filename) if lora.filename else str(local_dir)
        pipeline = merge_lora(pipeline, lora_file, lora.scale, device=device, dtype=WEIGHT_DTYPE)
        if transformer_2 is not None:
            pipeline = merge_lora(
                pipeline, lora_file, lora.scale,
                device=device, dtype=WEIGHT_DTYPE,
                sub_transformer_name="transformer_2",
            )
        merged.append((lora_file, lora.scale))
        logger.info(f"Merged LoRA: {lora_file} (scale={lora.scale})")
    return merged


def _unmerge_all_loras(pipeline, merged: list, device: str, transformer_2):
    for lora_file, scale in merged:
        pipeline = unmerge_lora(pipeline, lora_file, scale, device=device, dtype=WEIGHT_DTYPE)
        if transformer_2 is not None:
            pipeline = unmerge_lora(
                pipeline, lora_file, scale,
                device=device, dtype=WEIGHT_DTYPE,
                sub_transformer_name="transformer_2",
            )


def _aligned_video_length(raw_length: int, temporal_compression_ratio: int) -> int:
    if raw_length == 1:
        return 1
    return int((raw_length - 1) // temporal_compression_ratio * temporal_compression_ratio) + 1


def run_inference(job: Job, output_path: str) -> None:
    infer = job.input.inference
    media_paths = infer.mediaPaths
    device = _get_device()
    sample_size = [infer.height, infer.width]
    seed = infer.seed if infer.seed is not None else 42
    generator = torch.Generator(device=device).manual_seed(seed)
    negative_prompt = infer.negativePrompt or ""

    image_paths = [p for p in media_paths if not p.endswith(".mp4")]
    mode = "i2v" if image_paths else "t2v"

    pipeline, vae, config = _get_pipeline(infer.numSteps)
    boundary = config["transformer_additional_kwargs"].get("boundary", 0.900)
    transformer_2 = pipeline.transformer_2
    video_length = _aligned_video_length(infer.videoLength, vae.config.temporal_compression_ratio)

    logger.info(f"Mode: {mode} | size={sample_size} | steps={infer.numSteps} | seed={seed} | frames={video_length} | fps={infer.fps}")

    if mode == "t2v":
        input_video, input_video_mask, _ = get_image_to_video_latent(
            None, None, video_length=video_length, sample_size=sample_size,
        )
    else:
        pil_images = storage.load_input_videos([image_paths[0]])
        if not pil_images:
            raise RuntimeError(f"Failed to download input image: {image_paths[0]}")
        input_video, input_video_mask, _ = get_image_to_video_latent(
            pil_images[0], None, video_length=video_length, sample_size=sample_size,
        )
        if TEACACHE_ENABLED:
            pipeline.transformer.teacache_thresh = TEACACHE_THRESHOLD_I2V

    merged = _merge_all_loras(pipeline, job.input.loras, device, transformer_2) if job.input.loras else []

    with torch.no_grad():
        sample = pipeline(
            infer.prompt,
            num_frames=video_length,
            negative_prompt=negative_prompt,
            height=sample_size[0],
            width=sample_size[1],
            generator=generator,
            guidance_scale=infer.guidanceScale,
            num_inference_steps=infer.numSteps,
            video=input_video,
            mask_video=input_video_mask,
            boundary=boundary,
            shift=infer.shift,
        ).videos

    if merged:
        _unmerge_all_loras(pipeline, merged, device, transformer_2)

    save_videos_grid(sample, output_path, fps=infer.fps)
    logger.info(f"Saved {mode} output → {output_path}")
