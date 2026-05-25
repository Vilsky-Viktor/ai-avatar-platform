import gc
import math
import os
import subprocess
import cv2
import numpy as np
import imageio
import torch
from pathlib import Path
from PIL import Image
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
from .utils import timeit
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

# Model was trained at 81 pixel frames = 21 latent frames (temporal_compression_ratio=4).
# RIFLEx must be enabled for any inference that exceeds this to prevent RoPE period repetition.
RIFLEX_TRAIN_LATENT_FRAMES = 21
RIFLEX_K = int(os.environ.get("RIFLEX_K", "6"))

# Chunked generation: clips of CLIP_FRAMES generate 2s each at 16fps (model's training length
# was 81 frames; shorter clips concentrate motion better for I2V). Each clip's last
# CLIP_OVERLAP frames become the reference images for the next clip.
CLIP_FRAMES = 33   # 2s per clip at 16fps — shorter clips concentrate motion better for I2V
CLIP_OVERLAP = int(os.environ.get("CLIP_OVERLAP", "2"))

FLASHVSR_MODEL_NAME = os.environ.get("FLASHVSR_MODEL_NAME", "flash-vsr-v11")
FLASHVSR_RUNNER = os.path.join(os.path.dirname(__file__), "flashvsr_runner.py")

_device: Optional[str] = None
_pipeline: Optional[Wan2_2FunInpaintPipeline] = None
_vae = None
_config = None
_rife_model = None


def _get_device() -> str:
    global _device
    if _device is None:
        _device = set_multi_gpus_devices(1, 1)
    return _device


def _load_config(model_path: str):
    for filename in ("config.yaml", "configuration.json"):
        config_path = os.path.join(model_path, filename)
        if os.path.exists(config_path):
            cfg = OmegaConf.load(config_path)
            if "transformer_additional_kwargs" in cfg:
                return cfg
    bundled = Path(__file__).parent / "videox_fun" / "config" / "model_config.yaml"
    logger.warning(f"No VideoX-Fun config found in {model_path}, using bundled model_config.yaml")
    return OmegaConf.load(bundled)


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
            "transformer_high_noise_model_subpath", "transformer"
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
        apply_low = lora.boundary != "high"
        apply_high = lora.boundary != "low"
        if apply_low:
            pipeline = merge_lora(pipeline, lora_file, lora.scale, device=device, dtype=WEIGHT_DTYPE)
        if apply_high and transformer_2 is not None:
            pipeline = merge_lora(
                pipeline, lora_file, lora.scale,
                device=device, dtype=WEIGHT_DTYPE,
                sub_transformer_name="transformer_2",
            )
        merged.append((lora_file, lora.scale, lora.boundary))
        logger.info(f"Merged LoRA: {lora_file} (scale={lora.scale}, boundary={lora.boundary})")
    return merged


def _unmerge_all_loras(pipeline, merged: list, device: str, transformer_2):
    for lora_file, scale, boundary in merged:
        apply_low = boundary != "high"
        apply_high = boundary != "low"
        if apply_low:
            pipeline = unmerge_lora(pipeline, lora_file, scale, device=device, dtype=WEIGHT_DTYPE)
        if apply_high and transformer_2 is not None:
            pipeline = unmerge_lora(
                pipeline, lora_file, scale,
                device=device, dtype=WEIGHT_DTYPE,
                sub_transformer_name="transformer_2",
            )


def _get_rife():
    global _rife_model
    if _rife_model is None:
        from ccvfi import AutoModel, ConfigType
        _rife_model = AutoModel.from_pretrained(pretrained_model_name=ConfigType.RIFE_IFNet_v426_heavy)
        logger.info("RIFE model loaded")
    return _rife_model


@timeit
def _interpolate_fps(input_path: str, source_fps: int, target_fps: int) -> bool:
    tmp_2x = input_path + ".2x.mp4"
    tmp_out = input_path + ".interp.mp4"
    try:
        reader = imageio.get_reader(input_path)
        frames = [f for f in reader]
        reader.close()

        if len(frames) < 2:
            return False

        rife = _get_rife()
        double_frames = [frames[0]]
        for i in range(len(frames) - 1):
            frame_bgr_i = cv2.cvtColor(frames[i], cv2.COLOR_RGB2BGR)
            frame_bgr_next = cv2.cvtColor(frames[i + 1], cv2.COLOR_RGB2BGR)
            mid = rife.inference_image_list(img_list=[frame_bgr_i, frame_bgr_next])[0]
            double_frames.append(cv2.cvtColor(np.array(mid), cv2.COLOR_BGR2RGB))
            double_frames.append(frames[i + 1])

        writer = imageio.get_writer(tmp_2x, fps=source_fps * 2, codec="libx264", quality=8)
        for frame in double_frames:
            writer.append_data(frame)
        writer.close()

        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_2x, "-vf", f"fps={target_fps}", "-c:v", "libx264", "-crf", "18", "-preset", "fast", tmp_out],
            capture_output=True, text=True,
        )
        Path(tmp_2x).unlink(missing_ok=True)
        if result.returncode != 0:
            Path(tmp_out).unlink(missing_ok=True)
            logger.warning(f"RIFE FFmpeg resample failed: {result.stderr[-300:]}")
            return False

        os.replace(tmp_out, input_path)
        return True
    except Exception as e:
        Path(tmp_2x).unlink(missing_ok=True)
        Path(tmp_out).unlink(missing_ok=True)
        logger.warning(f"RIFE interpolation failed: {e}")
        return False


@timeit
def _upscale_video(input_path: str, scale: float) -> bool:
    tmp_output = input_path + ".flashvsr_out.mp4"
    model_dir = os.path.join(LOCAL_MODELS_PATH, FLASHVSR_MODEL_NAME)
    try:
        result = subprocess.run(
            [
                "python", FLASHVSR_RUNNER,
                "--input", input_path,
                "--output", tmp_output,
                "--model-dir", model_dir,
                "--scale", str(scale),
            ],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            logger.warning(f"FlashVSR failed:\nSTDOUT: {result.stdout[-1000:]}\nSTDERR: {result.stderr[-2000:]}")
            return False

        os.replace(tmp_output, input_path)
        return True
    except Exception as e:
        logger.warning(f"FlashVSR upscaling failed: {e}")
        return False
    finally:
        Path(tmp_output).unlink(missing_ok=True)


def _offload_pipeline_to_cpu() -> None:
    if _pipeline is not None:
        for component in _pipeline.components.values():
            if isinstance(component, torch.nn.Module):
                component.to("cpu")
    if _vae is not None:
        _vae.to("cpu")
    gc.collect()
    torch.cuda.empty_cache()
    logger.info(f"GPU memory freed before FlashVSR: {torch.cuda.memory_allocated() / 1024**3:.1f} GB allocated")


def _aligned_video_length(raw_length: int, temporal_compression_ratio: int) -> int:
    if raw_length == 1:
        return 1
    return int((raw_length - 1) // temporal_compression_ratio * temporal_compression_ratio) + 1


def _extract_context_frames(sample, n: int) -> list:
    frames = []
    for i in range(-n, 0):
        frame = sample[0, :, i, :, :]  # [C, H, W] in [0, 1]
        frame_np = (frame.permute(1, 2, 0).float().cpu().numpy() * 255).clip(0, 255).astype(np.uint8)
        frames.append(Image.fromarray(frame_np))
    return frames


@timeit
def _run_pipeline_clip(
    pipeline, vae, config, infer, reference_pils: Optional[list],
    clip_frames: int, seed: int, device: str,
):
    sample_size = [infer.height, infer.width]
    boundary = config["transformer_additional_kwargs"].get("boundary", 0.900)
    negative_prompt = infer.negativePrompt or ""
    generator = torch.Generator(device=device).manual_seed(seed)

    if reference_pils is None:
        input_video, input_video_mask, _ = get_image_to_video_latent(
            None, None, video_length=clip_frames, sample_size=sample_size,
        )
        if TEACACHE_ENABLED and pipeline.transformer.teacache is not None:
            pipeline.transformer.teacache.rel_l1_thresh = TEACACHE_THRESHOLD_T2V
    else:
        input_video, input_video_mask, _ = get_image_to_video_latent(
            reference_pils, None, video_length=clip_frames, sample_size=sample_size,
        )
        if TEACACHE_ENABLED and pipeline.transformer.teacache is not None:
            pipeline.transformer.teacache.rel_l1_thresh = TEACACHE_THRESHOLD_I2V

    with torch.no_grad():
        return pipeline(
            infer.prompt,
            num_frames=clip_frames,
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


def run_inference(job: Job, output_path: str) -> None:
    infer = job.input.inference
    media_paths = infer.mediaPaths
    device = _get_device()
    seed = infer.seed if infer.seed is not None else 42

    image_paths = [p for p in media_paths if not p.endswith(".mp4")]
    mode = "i2v" if image_paths else "t2v"

    pipeline, vae, config = _get_pipeline(infer.numSteps)
    transformer_2 = pipeline.transformer_2

    total_frames = _aligned_video_length(infer.videoLength, vae.config.temporal_compression_ratio)
    clips_needed = math.ceil((total_frames - CLIP_FRAMES) / (CLIP_FRAMES - CLIP_OVERLAP)) + 1 if total_frames > CLIP_FRAMES else 1

    logger.info(f"Mode: {mode} | size={[infer.height, infer.width]} | steps={infer.numSteps} | seed={seed} | total_frames={total_frames} | fps={infer.fps} | clips={clips_needed}")

    initial_reference_pils = None
    if mode == "i2v":
        pil_images = storage.load_input_images([image_paths[0]])
        if not pil_images:
            raise RuntimeError(f"Failed to download input image: {image_paths[0]}")
        initial_reference_pils = [pil_images[0]]

    merged = _merge_all_loras(pipeline, job.input.loras, device, transformer_2) if job.input.loras else []

    try:
        all_clips = []
        reference_pils = initial_reference_pils
        # All clips are CLIP_FRAMES; single-clip videos use total_frames (< CLIP_FRAMES).
        clip_frames = CLIP_FRAMES if clips_needed > 1 else total_frames
        for clip_idx in range(clips_needed):
            logger.info(f"Generating clip {clip_idx + 1}/{clips_needed} ({clip_frames} frames, seed={seed})")
            clip_sample = _run_pipeline_clip(
                pipeline, vae, config, infer,
                reference_pils=reference_pils,
                clip_frames=clip_frames,
                seed=seed,
                device=device,
            )
            all_clips.append(clip_sample)
            if clip_idx < clips_needed - 1:
                reference_pils = _extract_context_frames(clip_sample, CLIP_OVERLAP)

        if len(all_clips) == 1:
            sample = all_clips[0]
        else:
            parts = [all_clips[0]] + [c[:, :, CLIP_OVERLAP:, :, :] for c in all_clips[1:]]
            sample = torch.cat(parts, dim=2)

        sample = sample[:, :, :total_frames, :, :]
    finally:
        if merged:
            _unmerge_all_loras(pipeline, merged, device, transformer_2)

    if TEACACHE_ENABLED and pipeline.transformer.teacache is not None:
        pipeline.transformer.teacache.rel_l1_thresh = TEACACHE_THRESHOLD_T2V

    save_videos_grid(sample, output_path, fps=infer.fps)
    del sample, all_clips

    upscaler = job.input.upscaler
    if upscaler.enabled:
        logger.info(f"FlashVSR: {infer.width}x{infer.height} → {upscaler.scale}× scale")
        _upscale_video(output_path, upscaler.scale)

    interpolator = job.input.interpolator
    if interpolator.enabled and interpolator.targetFps != infer.fps:
        logger.info(f"RIFE: {infer.fps} FPS → {interpolator.targetFps} FPS")
        _interpolate_fps(output_path, infer.fps, interpolator.targetFps)

    logger.info(f"Saved {mode} output → {output_path}")
