import os
import torch
import random
from PIL import Image
from einops import rearrange
from flux2.model import Flux2
from flux2.sampling import (
    batched_prc_img, batched_prc_txt, denoise, denoise_cfg,
    encode_image_refs, get_schedule, scatter_ids,
)
from flux2.util import FLUX2_MODEL_INFO, load_ae, load_flow_model, load_text_encoder
from safetensors import safe_open
from safetensors.torch import load_file
from gen_text_image_to_image_service.logger import get_logger
from gen_text_image_to_image_service.openrouter import DEFAULT_SAMPLING_PARAMS, OpenRouterAPIClient

logger = get_logger(__name__)

DEVICE = torch.device("cuda")
MODELS = {}
MODEL_NAME = os.getenv("MODEL_NAME", "flux.2-dev")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "mistralai/pixtral-large-2411")
CONTROLNET_PATH = os.environ.get("CONTROLNET_PATH")
FLUX2_MODEL_PATH = os.environ.get("FLUX2_MODEL_PATH")

def _generate_random_seed():
    return random.randint(0, 2**32 - 1)

def detect_model_format(model_path: str) -> str:
    """
    Inspect the safetensors file and return one of:
      - 'fp8_scaled' : has scale_weight keys + scaled_fp8 flag (ComfyUI format)
      - 'fp8_mixed'  : FP8 weights but no scale_weight keys
      - 'bf16'       : standard full precision, or file not found
    """
    if not model_path or not os.path.exists(model_path):
        return "bf16"

    try:
        with safe_open(model_path, framework="pt") as f:
            keys = list(f.keys())

        has_scale_weight = any("scale_weight" in k for k in keys)
        has_scaled_fp8   = "scaled_fp8" in keys

        if has_scale_weight or has_scaled_fp8:
            logger.info("Detected fp8_scaled format (scale_weight keys present)")
            return "fp8_scaled"

        with safe_open(model_path, framework="pt") as f:
            sample_key = next(k for k in keys if "weight" in k)
            sample = f.get_tensor(sample_key)

        if sample.dtype in (torch.float8_e4m3fn, torch.float8_e5m2):
            logger.info("Detected fp8_mixed format (FP8 weights, no scale keys)")
            return "fp8_mixed"

        logger.info("Detected standard bf16/fp16 format")
        return "bf16"

    except Exception as e:
        logger.warning(f"Could not inspect model format: {e} — falling back to bf16 loader")
        return "bf16"


class FP8ScaledLinear(torch.nn.Linear):
    """
    Drop-in replacement for nn.Linear that supports the fp8_scaled format.
    Weights are stored as FP8, scale_weight stores the per-tensor inverse scale.
    During forward, weights are dequantized to bfloat16 before matmul.
    """
    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__(in_features, out_features, bias)
        self.scale_weight = torch.nn.Parameter(torch.ones(1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        w = self.weight.to(torch.bfloat16) * self.scale_weight.to(torch.bfloat16)
        return torch.nn.functional.linear(x, w, self.bias)


def _patch_linear_layers(module: torch.nn.Module) -> torch.nn.Module:
    """
    Recursively replace all nn.Linear layers with FP8ScaledLinear
    so that the state dict with scale_weight keys loads cleanly.
    """
    for name, child in module.named_children():
        if isinstance(child, torch.nn.Linear):
            replacement = FP8ScaledLinear(
                child.in_features,
                child.out_features,
                bias=child.bias is not None,
            )
            replacement.weight = child.weight
            replacement.bias   = child.bias
            setattr(module, name, replacement)
        else:
            _patch_linear_layers(child)
    return module


def _build_model_architecture(model_name: str) -> torch.nn.Module:
    """
    Build the Flux2 model architecture on meta device only —
    no weights loaded, no file access, no HuggingFace download.
    """
    with torch.device("meta"):
        model = Flux2(FLUX2_MODEL_INFO[model_name.lower()]["params"]).to(torch.bfloat16)
    return model


def _load_fp8_scaled(model_name: str, model_path: str, device: torch.device):
    """
    Load a fp8_scaled safetensors file (ComfyUI format with scale_weight keys).
    """
    logger.info("Using FP8-scaled loader")

    model = _build_model_architecture(model_name)
    model = _patch_linear_layers(model)

    sd = load_file(model_path, device=str(device))

    if "scaled_fp8" in sd:
        model.register_buffer("scaled_fp8", sd.pop("scaled_fp8"))

    missing, unexpected = model.load_state_dict(sd, strict=False, assign=True)
    if missing:
        logger.warning(f"FP8-scaled load — {len(missing)} missing keys (first 5: {missing[:5]})")
    if unexpected:
        logger.warning(f"FP8-scaled load — {len(unexpected)} unexpected keys (first 5: {unexpected[:5]})")

    return model.to(device)


def _load_fp8_mixed(model_name: str, model_path: str, device: torch.device):
    """
    Load a fp8_mixed safetensors file (FP8 weights, no scale_weight keys).
    Casts all FP8 tensors to bfloat16 so the standard model class accepts them.
    """
    logger.info("Using FP8-mixed loader (casting to bfloat16)")

    model = _build_model_architecture(model_name)
    sd = load_file(model_path, device=str(device))
    sd = {
        k: v.to(torch.bfloat16) if v.dtype in (torch.float8_e4m3fn, torch.float8_e5m2) else v
        for k, v in sd.items()
    }

    missing, unexpected = model.load_state_dict(sd, strict=False, assign=True)
    if missing:
        logger.warning(f"FP8-mixed load — {len(missing)} missing keys (first 5: {missing[:5]})")
    if unexpected:
        logger.warning(f"FP8-mixed load — {len(unexpected)} unexpected keys (first 5: {unexpected[:5]})")

    return model.to(device)


def smart_load_flow_model(model_name: str, device: torch.device):
    """
    Auto-detect the model format and route to the correct loader.
    """
    model_path = os.getenv("FLUX2_MODEL_PATH", "")
    fmt = detect_model_format(model_path)

    if fmt == "fp8_scaled":
        return _load_fp8_scaled(model_name, model_path, device)
    elif fmt == "fp8_mixed":
        return _load_fp8_mixed(model_name, model_path, device)
    else:
        logger.info("Using standard BF16 loader")
        return load_flow_model(model_name, device=device)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_models_into_vram():
    logger.info(f"Loading {MODEL_NAME} into VRAM")
    MODELS["text_encoder"] = load_text_encoder(MODEL_NAME, device=DEVICE)

    if "klein" in MODEL_NAME:
        MODELS["upsampling_model"] = load_text_encoder("flux.2-dev")
    else:
        MODELS["upsampling_model"] = MODELS["text_encoder"]

    MODELS["flow_model"] = smart_load_flow_model(MODEL_NAME, device=DEVICE)
    MODELS["ae"] = load_ae(MODEL_NAME).to(DEVICE)

    for m in MODELS.values():
        if hasattr(m, "eval"):
            m.eval()

    logger.info("Model Loading Complete")


def get_upsampling_model():
    return MODELS["upsampling_model"]


def prepare_params(job_input):
    model_info = FLUX2_MODEL_INFO[MODEL_NAME]
    model_params = {
        "prompt":           job_input.get("prompt", ""),
        "num_steps":        int(job_input.get("numSteps",   model_info.get("defaults", {}).get("num_steps", 13))),
        "guidance":         float(job_input.get("guidance", model_info.get("defaults", {}).get("guidance",  1.0))),
        "width":            int(job_input.get("width",  1360)),
        "height":           int(job_input.get("height", 768)),
        "upsample_mode":    job_input.get("upsamplePromptMode", "local"),
        "model_info":       model_info,
        "seed":             job_input.get("seed", None),
    }
    return model_params


def refine_prompt(params, img_ctx):
    upsampling_model = MODELS["upsampling_model"]
    prompt = params["prompt"]

    # if upsampling_model.test_txt(prompt):
    #     raise ValueError("Flagged Prompt Detected.")

    if params["upsample_mode"] == "openrouter" and os.getenv("OPENROUTER_API_KEY"):
        logger.debug(f"Upsampling prompt with OpenRouter")
        client = OpenRouterAPIClient(
            model=OPENROUTER_MODEL,
            sampling_params=DEFAULT_SAMPLING_PARAMS.get(OPENROUTER_MODEL, {}),
        )
        upsampled = client.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
        prompt = upsampled[0] if upsampled else prompt
        logger.info(prompt)
        logger.info(f"prompt size: {len(prompt.split())} words")
        return prompt

    if params["upsample_mode"] == "local":
        logger.debug(f"Upsampling prompt with local text encoder")
        upsampled = upsampling_model.upsample_prompt([prompt], img=[img_ctx] if img_ctx else None)
        return upsampled[0] if upsampled else prompt

    return prompt


def run_inference(avatar_id, params, reference_images, final_prompt):
    model_info = params["model_info"]

    seed = params["seed"] if params["seed"] else _generate_random_seed()
    logger.info(f"Seed {seed}")

    with torch.no_grad():
        ref_tokens, ref_ids = encode_image_refs(MODELS["ae"], reference_images)

        if model_info["guidance_distilled"]:
            ctx = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
        else:
            ctx_empty  = MODELS["text_encoder"]([""]).to(torch.bfloat16)
            ctx_prompt = MODELS["text_encoder"]([final_prompt]).to(torch.bfloat16)
            ctx = torch.cat([ctx_empty, ctx_prompt], dim=0)

        ctx, ctx_ids = batched_prc_txt(ctx)
        shape = (1, 128, params["height"] // 16, params["width"] // 16)
        generator = torch.Generator(device="cuda").manual_seed(seed)
        randn = torch.randn(shape, generator=generator, dtype=torch.bfloat16, device="cuda")
        x, x_ids  = batched_prc_img(randn)
        timesteps = get_schedule(params["num_steps"], x.shape[1])

        denoise_fn = denoise if model_info["guidance_distilled"] else denoise_cfg
        x = denoise_fn(
            MODELS["flow_model"], x, x_ids, ctx, ctx_ids,
            timesteps=timesteps, guidance=params["guidance"],
            img_cond_seq=ref_tokens, img_cond_seq_ids=ref_ids,
        )

        x = torch.cat(scatter_ids(x, x_ids)).squeeze(2)
        x = MODELS["ae"].decode(x).float()
        x = x.clamp(-1, 1)
        x = rearrange(x[0], "c h w -> h w c")
        img = Image.fromarray((127.5 * (x + 1.0)).cpu().byte().numpy())

    # if MODELS["upsampling_model"].test_image(img):
    #     raise ValueError("Output flagged by safety filter.")

    return img
