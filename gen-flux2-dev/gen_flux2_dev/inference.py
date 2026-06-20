import os
import sys
import secrets
import warnings
from functools import partial
from pathlib import Path

import torch
from torchao.quantization import quantize_, Float8DynamicActivationFloat8WeightConfig, PerRow
from diffusers import FlowMatchEulerDiscreteScheduler
from omegaconf import OmegaConf
from PIL import Image
from safetensors.torch import load_file
from gen_flux2_dev.logger import get_logger
from gen_flux2_dev.models import JobInput, LoraConfig
import gen_flux2_dev.utils as utils

current_file_path = os.path.abspath(__file__)
project_roots = [os.path.dirname(current_file_path), os.path.dirname(os.path.dirname(current_file_path)), os.path.dirname(os.path.dirname(os.path.dirname(current_file_path)))]
for project_root in project_roots:
    sys.path.insert(0, project_root) if project_root not in sys.path else None

from gen_flux2_dev.pipeline.dist import set_multi_gpus_devices, shard_model
from gen_flux2_dev.pipeline.models import (AutoencoderKLFlux2,
                               Mistral3ForConditionalGeneration,
                               PixtralProcessor, Flux2ControlTransformer2DModel)
from gen_flux2_dev.pipeline.utils.utils import (get_image, get_image_latent)
from gen_flux2_dev.pipeline.pipeline import Flux2ControlPipeline
from gen_flux2_dev.pipeline.utils.fm_solvers import FlowDPMSolverMultistepScheduler
from gen_flux2_dev.pipeline.utils.fm_solvers_unipc import FlowUniPCMultistepScheduler


FLUX2_MODEL_PATH = os.getenv("FLUX2_MODEL_PATH", "/workspace/models/flux.2-dev")
WARMUP_RESOLUTIONS = [(1024, 1024)]
WARMUP_STEPS = int(os.getenv("WARMUP_STEPS", "25"))
# Choose precision in "bf16", "fp8"
MODEL_PRECISION = os.getenv("MODEL_PRECISION", "fp8")
# Choose the sampler in "euler", "unipc", "dpm++"
MODEL_SAMPLER_NAME = os.getenv("MODEL_SAMPLER_NAME", "dpm++")
USE_MODEL_COMPILATION = os.getenv("USE_MODEL_COMPILATION", "true").lower() == "true"

logger = get_logger(__name__)

ulysses_degree      = 1
ring_degree         = 1
fsdp_dit            = False
fsdp_text_encoder   = False
config_path         = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yaml")
transformer_path    = f"{FLUX2_MODEL_PATH}/FLUX.2-dev-Fun-Controlnet-Union-2602.safetensors"
vae_path            = None
weight_dtype        = torch.bfloat16

pipeline    = None
device      = None
# Maps adapter_name -> scale for currently loaded adapters.
# adapter_name is the LoRA path relative to /workspace (lora.path), used as stable identity.
_lora_cache: dict[str, float] = {}


@utils.timeit
def load_pipeline():
    global pipeline, device

    logger.info("Loading Flux 2 dev controlnet pipeline ...")

    device = set_multi_gpus_devices(ulysses_degree, ring_degree)
    config = OmegaConf.load(config_path)

    transformer = Flux2ControlTransformer2DModel.from_pretrained(
        FLUX2_MODEL_PATH,
        subfolder="transformer",
        low_cpu_mem_usage=True,
        torch_dtype=weight_dtype,
        transformer_additional_kwargs=OmegaConf.to_container(config['transformer_additional_kwargs']),
    ).to(weight_dtype)

    if transformer_path is not None:
        logger.info(f"From checkpoint: {transformer_path}")
        if transformer_path.endswith("safetensors"):
            state_dict = load_file(transformer_path)
        else:
            state_dict = torch.load(transformer_path, map_location="cpu")
        state_dict = state_dict["state_dict"] if "state_dict" in state_dict else state_dict

        m, u = transformer.load_state_dict(state_dict, strict=False)
        logger.warning(f"missing keys: {len(m)}, unexpected keys: {len(u)}")

    vae = AutoencoderKLFlux2.from_pretrained(
        FLUX2_MODEL_PATH,
        subfolder="vae"
    ).to(weight_dtype)

    if vae_path is not None:
        logger.info(f"From checkpoint: {vae_path}")
        if vae_path.endswith("safetensors"):
            state_dict = load_file(vae_path)
        else:
            state_dict = torch.load(vae_path, map_location="cpu")
        state_dict = state_dict["state_dict"] if "state_dict" in state_dict else state_dict

        m, u = vae.load_state_dict(state_dict, strict=False)
        logger.warning(f"missing keys: {len(m)}, unexpected keys: {len(u)}")

    tokenizer = PixtralProcessor.from_pretrained(
        FLUX2_MODEL_PATH, subfolder="tokenizer"
    )
    text_encoder = Mistral3ForConditionalGeneration.from_pretrained(
        FLUX2_MODEL_PATH, subfolder="text_encoder", torch_dtype=weight_dtype,
        low_cpu_mem_usage=True,
    )

    chosen_scheduler = {
        "euler": FlowMatchEulerDiscreteScheduler,
        "unipc": FlowUniPCMultistepScheduler,
        "dpm++": FlowDPMSolverMultistepScheduler,
    }[MODEL_SAMPLER_NAME]

    scheduler = chosen_scheduler.from_pretrained(
        FLUX2_MODEL_PATH,
        subfolder="scheduler"
    )

    pipeline = Flux2ControlPipeline(
        vae=vae,
        tokenizer=tokenizer,
        text_encoder=text_encoder,
        transformer=transformer,
        scheduler=scheduler,
    )

    if ulysses_degree > 1 or ring_degree > 1:
        transformer.enable_multi_gpus_inference()
        if fsdp_dit:
            shard_fn = partial(shard_model, device_id=device, param_dtype=weight_dtype, module_to_wrapper=list(transformer.transformer_blocks) + list(transformer.single_transformer_blocks))
            pipeline.transformer = shard_fn(pipeline.transformer)
            logger.info("Add FSDP DIT")
        if fsdp_text_encoder:
            shard_fn = partial(shard_model, device_id=device, param_dtype=weight_dtype, module_to_wrapper=text_encoder.language_model.layers, ignored_modules=[text_encoder.language_model.embed_tokens], transformer_layer_cls_to_wrap=["MistralDecoderLayer", "PixtralTransformer"])
            text_encoder = shard_fn(text_encoder)
            logger.info("Add FSDP TEXT ENCODER")

    logger.info("Loading model into VRAM ...")
    pipeline.to(device=device)

    if MODEL_PRECISION == "fp8":
        logger.info("Applying FP8 quantization to transformer ...")
        quantize_(pipeline.transformer, Float8DynamicActivationFloat8WeightConfig(granularity=PerRow()))
        logger.info("FP8 quantization applied")

    if USE_MODEL_COMPILATION:
        logger.info("Add dynamic max autotune compilation with no cuda graphs")
        total_blocks = len(pipeline.transformer.transformer_blocks) + len(pipeline.transformer.single_transformer_blocks)
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
        for i in range(len(pipeline.transformer.transformer_blocks)):
            pipeline.transformer.transformer_blocks[i] = torch.compile(pipeline.transformer.transformer_blocks[i], **compile_kwargs)
        for i in range(len(pipeline.transformer.single_transformer_blocks)):
            pipeline.transformer.single_transformer_blocks[i] = torch.compile(pipeline.transformer.single_transformer_blocks[i], **compile_kwargs)

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


def _warmup_single(height: int, width: int, control_image, images: list, control_context_scale: float = 0.75):
    pipeline(
        prompt                = "Keep exact facial identity and proportions from reference image. Front close-up headshot ID photo. Wearing white t-shirt. Soft diffused studio lighting. Plain light gray background. No color grading, natural skin tones, no filters. 85mm portrait lens, no lens distortion. Hyperrealistic photograph, 8K detail, skin details, hair details. Sharp focus on face",
        height                = height,
        width                 = width,
        generator             = torch.Generator(device=device).manual_seed(0),
        guidance_scale        = 4.0,
        image                 = [get_image(img) for img in images],
        inpaint_image         = torch.zeros([1, 3, height, width]),
        mask_image            = torch.ones([1, 1, height, width]) * 255,
        control_image         = control_image,
        num_inference_steps   = WARMUP_STEPS,
        control_context_scale = control_context_scale,
    )

def warmup(images: list, pose_images: list | None = None):
    logger.info("Warming up pipeline (compiling kernels) ...")
    with torch.no_grad():
        for i, (height, width) in enumerate(WARMUP_RESOLUTIONS):
            logger.info(f"Warming up {width}x{height} without controlnet (scale=0) ...")
            _warmup_single(height, width, control_image=None, images=images, control_context_scale=0)

            logger.info(f"Warming up {width}x{height} with control image ...")
            pose_img = pose_images[i] if pose_images and i < len(pose_images) else Image.new("RGB", (width, height), (128, 128, 128))
            dummy_control = get_image_latent(pose_img, sample_size=[height, width])[:, :, 0]
            _warmup_single(height, width, control_image=dummy_control, images=images, control_context_scale=0.5)

    logger.info("Warmup complete")


BUCKET_SIZE = 1_000_000

def _generate_bucketed_seed(run_num: int) -> int:
    return secrets.randbelow(BUCKET_SIZE) + (run_num * BUCKET_SIZE)


@utils.timeit
def run_inference(job_input: JobInput, images: list[Image.Image]):
    if not images:
        images = [Image.new("RGB", (job_input.inference.width, job_input.inference.height), (255, 255, 255))]

    seed = job_input.inference.seed or secrets.randbelow(2**32)
    generator = torch.Generator(device=device).manual_seed(seed)

    logger.info(f"Using seed {seed}")

    prompt = job_input.inference.prompt
    guidance_scale = job_input.inference.guidanceScale
    num_inference_steps = job_input.inference.numSteps
    width = job_input.inference.width
    height = job_input.inference.height
    sample_size = [height, width]

    with torch.no_grad():
        image = [get_image(_image) for _image in images]

        pipeline_inpaint = torch.zeros([1, 3, sample_size[0], sample_size[1]])
        pipeline_mask = torch.ones([1, 1, sample_size[0], sample_size[1]]) * 255

        img = pipeline(
            prompt              = prompt,
            height              = sample_size[0],
            width               = sample_size[1],
            generator           = generator,
            guidance_scale      = guidance_scale,
            image               = image,
            inpaint_image       = pipeline_inpaint,
            mask_image          = pipeline_mask,
            control_image       = None,
            num_inference_steps = num_inference_steps,
            control_context_scale = 0,
        ).images[0]

    return img, seed
