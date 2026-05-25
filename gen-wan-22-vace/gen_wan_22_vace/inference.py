import gc
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
    VaceWanTransformer3DModel,
)
from .videox_fun.models.cache_utils import get_teacache_coefficients
from .videox_fun.pipeline import Wan2_2VaceFunPipeline
from .videox_fun.utils.fp8_optimization import (
    convert_model_weight_to_float8,
    replace_parameters_by_name,
    convert_weight_dtype_wrapper,
)
from .videox_fun.utils.lora_utils import merge_lora, unmerge_lora
from .videox_fun.utils.utils import (
    filter_kwargs,
    get_image_to_video_latent,
    get_image_latent,
    get_video_to_video_latent,
    save_videos_grid,
)
from .videox_fun.utils.fm_solvers import FlowDPMSolverMultistepScheduler
from .videox_fun.utils.fm_solvers_unipc import FlowUniPCMultistepScheduler
from .models import Job
from .logger import get_logger
from .utils import timeit
from .dwpose import generate_pose_video
import gen_wan_22_vace.storage as storage

logger = get_logger(__name__)

LOCAL_MODELS_PATH = os.environ.get("LOCAL_MODELS_PATH", "/workspace/models")
LOCAL_LORAS_PATH = os.environ.get("LOCAL_LORAS_PATH", "/workspace/loras")

VACE_MODEL_NAME = os.environ.get("VACE_MODEL_NAME", "wan2.2-vace-fun-a14b")

GPU_MEMORY_MODE = os.environ.get("GPU_MEMORY_MODE", "sequential_cpu_offload")
WEIGHT_DTYPE = torch.bfloat16

TEACACHE_ENABLED = os.environ.get("TEACACHE_ENABLED", "true").lower() == "true"
TEACACHE_THRESHOLD = float(os.environ.get("TEACACHE_THRESHOLD", "0.10"))
TEACACHE_SKIP_STEPS = int(os.environ.get("TEACACHE_SKIP_STEPS", "5"))

RIFLEX_TRAIN_LATENT_FRAMES = 21
RIFLEX_K = int(os.environ.get("RIFLEX_K", "6"))

FLASHVSR_MODEL_NAME = os.environ.get("FLASHVSR_MODEL_NAME", "flash-vsr-v11")
FLASHVSR_RUNNER = os.path.join(os.path.dirname(__file__), "flashvsr_runner.py")

_device: Optional[str] = None
_pipeline: Optional[Wan2_2VaceFunPipeline] = None
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


def _get_pipeline(num_steps: int):
    global _pipeline, _vae, _config

    if _pipeline is not None:
        return _pipeline, _vae, _config

    device = _get_device()
    model_path = os.path.join(LOCAL_MODELS_PATH, VACE_MODEL_NAME)
    logger.info(f"Loading VACE pipeline from {model_path}")

    config = _load_config(model_path)
    _config = config
    transformer_kwargs = OmegaConf.to_container(config["transformer_additional_kwargs"])

    low_noise_subpath = config["transformer_additional_kwargs"].get(
        "transformer_low_noise_model_subpath", "transformer"
    )
    transformer = VaceWanTransformer3DModel.from_pretrained(
        os.path.join(model_path, low_noise_subpath),
        transformer_additional_kwargs=transformer_kwargs,
        low_cpu_mem_usage=True,
        torch_dtype=WEIGHT_DTYPE,
    )
    transformer_2 = None
    if config["transformer_additional_kwargs"].get("transformer_combination_type", "single") == "moe":
        high_noise_subpath = config["transformer_additional_kwargs"].get(
            "transformer_high_noise_model_subpath", "transformer"
        )
        transformer_2 = VaceWanTransformer3DModel.from_pretrained(
            os.path.join(model_path, high_noise_subpath),
            transformer_additional_kwargs=transformer_kwargs,
            low_cpu_mem_usage=True,
            torch_dtype=WEIGHT_DTYPE,
        )

    Chosen_AutoencoderKL = {
        "AutoencoderKLWan": AutoencoderKLWan,
        "AutoencoderKLWan3_8": AutoencoderKLWan3_8,
    }[config["vae_kwargs"].get("vae_type", "AutoencoderKLWan")]
    vae = Chosen_AutoencoderKL.from_pretrained(
        os.path.join(model_path, config["vae_kwargs"].get("vae_subpath", "vae")),
        additional_kwargs=OmegaConf.to_container(config["vae_kwargs"]),
    ).to(WEIGHT_DTYPE)
    _vae = vae

    tokenizer = AutoTokenizer.from_pretrained(
        os.path.join(model_path, config["text_encoder_kwargs"].get("tokenizer_subpath", "tokenizer"))
    )
    text_encoder = WanT5EncoderModel.from_pretrained(
        os.path.join(model_path, config["text_encoder_kwargs"].get("text_encoder_subpath", "text_encoder")),
        additional_kwargs=OmegaConf.to_container(config["text_encoder_kwargs"]),
        low_cpu_mem_usage=True,
        torch_dtype=WEIGHT_DTYPE,
    ).eval()

    scheduler_cls = {
        "Flow": FlowMatchEulerDiscreteScheduler,
        "Flow_Unipc": FlowUniPCMultistepScheduler,
        "Flow_DPM++": FlowDPMSolverMultistepScheduler,
    }["Flow"]
    scheduler = scheduler_cls(
        **filter_kwargs(scheduler_cls, OmegaConf.to_container(config["scheduler_kwargs"]))
    )

    pipeline = Wan2_2VaceFunPipeline(
        transformer=transformer,
        transformer_2=transformer_2,
        vae=vae,
        tokenizer=tokenizer,
        text_encoder=text_encoder,
        scheduler=scheduler,
    )

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
    else:
        pipeline.to(device=device)

    if TEACACHE_ENABLED:
        coefficients = get_teacache_coefficients(model_path)
        if coefficients is not None:
            logger.info(f"TeaCache enabled: threshold={TEACACHE_THRESHOLD}, skip_steps={TEACACHE_SKIP_STEPS}")
            pipeline.transformer.enable_teacache(
                coefficients, num_steps, TEACACHE_THRESHOLD,
                num_skip_start_steps=TEACACHE_SKIP_STEPS, offload=False,
            )
            if transformer_2 is not None:
                pipeline.transformer_2.share_teacache(transformer=pipeline.transformer)

    _pipeline = pipeline
    logger.info("VACE pipeline loaded")
    return _pipeline, _vae, _config


def _merge_all_loras(pipeline, loras, device: str, transformer_2) -> list:
    merged = []
    for lora in loras:
        lora_file = os.path.join(LOCAL_LORAS_PATH, lora.path)
        if lora.filename:
            lora_file = os.path.join(lora_file, lora.filename)
        boundary = lora.boundary
        apply_low = boundary != "high"
        apply_high = boundary != "low"
        if apply_low:
            pipeline = merge_lora(pipeline, lora_file, lora.scale, device=device, dtype=WEIGHT_DTYPE)
        if apply_high and transformer_2 is not None:
            pipeline = merge_lora(
                pipeline, lora_file, lora.scale,
                device=device, dtype=WEIGHT_DTYPE,
                sub_transformer_name="transformer_2",
            )
        merged.append((lora_file, lora.scale, boundary))
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


_VIDEO_EXTS = {".mp4", ".webm", ".avi", ".mov", ".mkv"}


def _split_media_paths(media_paths: list) -> tuple[list, str | None]:
    """Split mediaPaths into (image_paths, control_video_path)."""
    images = [p for p in media_paths if Path(p).suffix.lower() not in _VIDEO_EXTS]
    videos = [p for p in media_paths if Path(p).suffix.lower() in _VIDEO_EXTS]
    return images, videos[0] if videos else None


@timeit
def run_inference(job: Job, output_path: str) -> None:
    infer = job.input.inference
    device = _get_device()
    seed = infer.seed if infer.seed is not None else 42
    sample_size = [infer.height, infer.width]

    pipeline, vae, config = _get_pipeline(infer.numSteps)
    transformer_2 = pipeline.transformer_2
    boundary = config["transformer_additional_kwargs"].get("boundary", 0.875)

    video_length = _aligned_video_length(infer.videoLength, vae.config.temporal_compression_ratio)
    latent_frames = (video_length - 1) // vae.config.temporal_compression_ratio + 1
    use_riflex = latent_frames > RIFLEX_TRAIN_LATENT_FRAMES

    image_paths, control_video_path = _split_media_paths(infer.mediaPaths)
    mode = infer.mode

    logger.info(
        f"Mode: {mode} | size={sample_size} | steps={infer.numSteps} | seed={seed} "
        f"| frames={video_length} | fps={infer.fps} | riflex={use_riflex}"
    )

    # ── Load inputs ──────────────────────────────────────────────────────────

    # Start image (i2v only)
    start_pil = None
    if mode == "i2v" and image_paths:
        pils = storage.load_input_images([image_paths[0]])
        if not pils:
            raise RuntimeError(f"Failed to download start image: {image_paths[0]}")
        start_pil = pils[0]

    # Subject reference images (s2v and v2v_control_ref)
    subject_ref_images = None
    ref_paths = image_paths if mode != "i2v" else []
    if ref_paths:
        ref_pils = storage.load_input_images(ref_paths)
        if not ref_pils:
            raise RuntimeError(f"Failed to download subject reference images: {ref_paths}")
        subject_ref_images = [
            get_image_latent(pil, sample_size=sample_size, padding=True)
            for pil in ref_pils
        ]
        subject_ref_images = torch.cat(subject_ref_images, dim=2)

    # Control video (v2v_control_ref only) — run DWPose to extract pose skeleton
    control_video = None
    if mode == "v2v_control_ref" and control_video_path:
        local_video_path = storage.download_video_to_local(control_video_path)
        logger.info(f"Running DWPose on control video: {control_video_path}")
        pose_video_path = generate_pose_video(
            local_video_path, video_length=video_length,
            target_h=infer.height, target_w=infer.width, fps=infer.fps,
        )
        control_video, _, _, _ = get_video_to_video_latent(
            pose_video_path, video_length=video_length,
            sample_size=sample_size, fps=infer.fps, ref_image=None,
        )

    # Inpaint latents — i2v conditions on start frame, s2v/v2v_control_ref use unconditioned mask
    if mode == "i2v":
        inpaint_video, inpaint_mask, _ = get_image_to_video_latent(
            start_pil, None, video_length=video_length, sample_size=sample_size,
        )
    else:
        inpaint_video, inpaint_mask, _ = get_image_to_video_latent(
            None, None, video_length=video_length, sample_size=sample_size,
        )

    # ── Merge LoRAs ──────────────────────────────────────────────────────────

    merged = _merge_all_loras(pipeline, job.input.loras, device, transformer_2) if job.input.loras else []

    # ── Generate ─────────────────────────────────────────────────────────────

    if use_riflex:
        pipeline.transformer.enable_riflex(k=RIFLEX_K, L_test=latent_frames)
        if transformer_2 is not None:
            transformer_2.enable_riflex(k=RIFLEX_K, L_test=latent_frames)

    generator = torch.Generator(device=device).manual_seed(seed)

    try:
        with torch.no_grad():
            sample = pipeline(
                infer.prompt,
                num_frames=video_length,
                negative_prompt=infer.negativePrompt or "",
                height=sample_size[0],
                width=sample_size[1],
                generator=generator,
                guidance_scale=infer.guidanceScale,
                num_inference_steps=infer.numSteps,
                video=inpaint_video,
                mask_video=inpaint_mask,
                control_video=control_video,
                subject_ref_images=subject_ref_images,
                boundary=boundary,
                shift=infer.shift,
                vace_context_scale=infer.vaceContextScale,
            ).videos
    finally:
        if use_riflex:
            pipeline.transformer.disable_riflex()
            if transformer_2 is not None:
                transformer_2.disable_riflex()
        if merged:
            _unmerge_all_loras(pipeline, merged, device, transformer_2)

    save_videos_grid(sample, output_path, fps=infer.fps)
    del sample

    upscaler = job.input.upscaler
    if upscaler.enabled:
        logger.info(f"FlashVSR: {infer.width}x{infer.height} → {upscaler.scale}× scale")
        _offload_pipeline_to_cpu()
        _upscale_video(output_path, upscaler.scale)

    interpolator = job.input.interpolator
    if interpolator.enabled and interpolator.targetFps != infer.fps:
        logger.info(f"RIFE: {infer.fps} FPS → {interpolator.targetFps} FPS")
        _interpolate_fps(output_path, infer.fps, interpolator.targetFps)

    logger.info(f"Saved {infer.mode} output → {output_path}")
