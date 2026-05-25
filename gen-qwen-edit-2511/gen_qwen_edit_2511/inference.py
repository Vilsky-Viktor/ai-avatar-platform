import logging
import math
import os
import queue
import secrets
import warnings
from contextlib import contextmanager
from pathlib import Path

import torch
from diffusers import QwenImageEditPlusPipeline, TorchAoConfig
from diffusers.quantizers.pipe_quant_config import PipelineQuantizationConfig
from optimum.quanto import freeze as quanto_freeze
from optimum.quanto import qtypes
from optimum.quanto import quantize as quanto_quantize
from PIL import Image
from torchao.quantization.quant_api import Int8WeightOnlyConfig, UIntXWeightOnlyConfig

from gen_qwen_edit_2511.logger import get_logger
from gen_qwen_edit_2511.models import InferenceConfig, FaceExpression, LoraConfig
from gen_qwen_edit_2511.storage import LOCAL_LORAS_PATH
import gen_qwen_edit_2511.utils as utils


QWEN_MODEL_PATH       = os.getenv("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")
QUANTIZE_TRANSFORMER  = os.getenv("QUANTIZE_TRANSFORMER", "false")   # false | uint3 | uint4 | uint8 | int8
QUANTIZE_TEXT_ENCODER = os.getenv("QUANTIZE_TEXT_ENCODER", "false")  # false | qfloat8 | int8
CONDITION_IMAGE_SIZE  = 384 * 384

def _torchao_config(qtype: str):
    configs = {
        "uint3": UIntXWeightOnlyConfig(torch.uint3),
        "uint4": UIntXWeightOnlyConfig(torch.uint4),
        "uint8": UIntXWeightOnlyConfig(torch.uint8),
        "int8":  Int8WeightOnlyConfig(),
    }
    if qtype not in configs:
        raise ValueError(f"Unknown QUANTIZE_TRANSFORMER value: {qtype!r}. Valid: {list(configs)}")
    return configs[qtype]

logging.getLogger("diffusers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", category=RuntimeWarning, module="peft")
warnings.filterwarnings("ignore", category=UserWarning,    module="peft")

logger = get_logger(__name__)

_pool: queue.Queue["_PipelineInstance"] = queue.Queue()


class _PipelineInstance:
    def __init__(self, idx: int):
        self.idx = idx
        self.pipeline = None
        self.device = None
        self._lora_cache: dict[tuple[str, str | None], float] = {}

    @utils.timeit
    def load(self):
        logger.info(f"[instance {self.idx}] Loading Qwen Image Edit 2511 pipeline ...")
        self.device = "cuda"

        load_kwargs: dict = {"torch_dtype": torch.bfloat16, "low_cpu_mem_usage": True}
        if QUANTIZE_TRANSFORMER != "false":
            load_kwargs["quantization_config"] = PipelineQuantizationConfig(
                quant_mapping={"transformer": TorchAoConfig(_torchao_config(QUANTIZE_TRANSFORMER))}
            )
            logger.info(f"[instance {self.idx}] Will quantize transformer ({QUANTIZE_TRANSFORMER}) during load ...")

        self.pipeline = QwenImageEditPlusPipeline.from_pretrained(QWEN_MODEL_PATH, **load_kwargs)

        if QUANTIZE_TRANSFORMER != "false":
            logger.info(f"[instance {self.idx}] Transformer quantization done")

        if QUANTIZE_TEXT_ENCODER != "false":
            logger.info(f"[instance {self.idx}] Quantizing text encoder ({QUANTIZE_TEXT_ENCODER}) ...")
            quanto_quantize(self.pipeline.text_encoder, weights=qtypes[QUANTIZE_TEXT_ENCODER])
            quanto_freeze(self.pipeline.text_encoder)
            logger.info(f"[instance {self.idx}] Text encoder quantization done")

        logger.info(f"[instance {self.idx}] Loading model into VRAM ...")
        self.pipeline.to(device=self.device)
        logger.info(f"[instance {self.idx}] Model loaded into VRAM")

        self.pipeline.set_progress_bar_config(disable=True)
        logger.info(f"[instance {self.idx}] Pipeline ready")

    def clear_cache(self):
        torch.cuda.empty_cache()

    def _cache_key(self, lora: LoraConfig) -> tuple[str, str | None]:
        return (lora.path, lora.filename)

    def _adapter_name(self, path: str, filename: str | None = None) -> str:
        key = f"{path}__{filename}" if filename else path
        return key.replace("/", "__").replace(".", "_")

    @utils.timeit
    def sync_loras(self, loras: list[LoraConfig]):
        incoming: dict[tuple[str, str | None], float] = {self._cache_key(lora): lora.scale for lora in loras}

        to_remove = [key for key in self._lora_cache if key not in incoming]
        to_update = [key for key in self._lora_cache if key in incoming and incoming[key] != self._lora_cache[key]]
        to_load   = [lora for lora in loras if self._cache_key(lora) not in self._lora_cache]

        if not to_remove and not to_update and not to_load:
            logger.info(f"[instance {self.idx}] LoRA cache hit — all adapters already loaded with correct scales")
            return

        if to_remove:
            logger.info(f"[instance {self.idx}] Removing {len(to_remove)} stale LoRA(s): {[Path(k[0]).name for k in to_remove]}")
            self.pipeline.delete_adapters([self._adapter_name(*key) for key in to_remove])
            for key in to_remove:
                del self._lora_cache[key]

        for lora in to_load:
            local_path   = str(Path(LOCAL_LORAS_PATH) / lora.path)
            adapter_name = self._adapter_name(lora.path, lora.filename)
            logger.info(f"[instance {self.idx}]   [load] {Path(lora.path).name} file={lora.filename} scale={lora.scale}")
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=RuntimeWarning, module="peft")
                warnings.filterwarnings("ignore", category=UserWarning,    module="peft")
                self.pipeline.load_lora_weights(local_path, adapter_name=adapter_name, weight_name=lora.filename)
            self._lora_cache[self._cache_key(lora)] = lora.scale

        if to_update:
            logger.info(f"[instance {self.idx}] Updating scale for {len(to_update)} LoRA(s): {[Path(k[0]).name for k in to_update]}")
            for key in to_update:
                self._lora_cache[key] = incoming[key]

        active_names  = [self._adapter_name(lora.path, lora.filename) for lora in loras]
        active_scales = [lora.scale for lora in loras]
        self.pipeline.set_adapters(active_names, adapter_weights=active_scales)
        logger.info(f"[instance {self.idx}] LoRAs synced — {len(active_names)} active: {[Path(lora.path).name for lora in loras]}")

    @utils.timeit
    def clear_loras(self):
        if not self._lora_cache:
            return
        try:
            self.pipeline.delete_adapters([self._adapter_name(*key) for key in self._lora_cache])
            self.pipeline.unload_lora_weights()
            self._lora_cache = {}
            logger.info(f"[instance {self.idx}] LoRAs fully cleared")
        except Exception as e:
            logger.warning(f"[instance {self.idx}] Failed to clear LoRAs: {e}")

    def _resize_images_for_condition(self, images: list[Image.Image]) -> list[Image.Image]:
        result = []
        for img in images:
            w, h = img.size
            ratio    = w / h
            target_w = math.sqrt(CONDITION_IMAGE_SIZE * ratio)
            target_h = target_w / ratio
            target_w = round(target_w / 32) * 32
            target_h = round(target_h / 32) * 32
            result.append(self.pipeline.image_processor.resize(img, int(target_h), int(target_w)))
        return result

    def _build_expression_embeds(self, inference: InferenceConfig, face_expression: FaceExpression, images: list[Image.Image]):
        prompt_tgt = f"Edit the person to show a {face_expression.type} expression. {inference.prompt}".strip()
        prompt_neu = f"Edit the person to show a neutral expression. {inference.prompt}".strip()

        condition_images = self._resize_images_for_condition(images)

        with torch.no_grad():
            embed_tgt, mask_tgt = self.pipeline.encode_prompt(
                prompt=prompt_tgt,
                image=condition_images,
                device=self.device,
                num_images_per_prompt=1,
            )
            embed_neu, _ = self.pipeline.encode_prompt(
                prompt=prompt_neu,
                image=condition_images,
                device=self.device,
                num_images_per_prompt=1,
            )

        prompt_embeds = embed_neu + face_expression.scale * (embed_tgt - embed_neu)

        if mask_tgt is None:
            mask_tgt = torch.ones(prompt_embeds.shape[:2], dtype=torch.long, device=prompt_embeds.device)

        return prompt_embeds, mask_tgt

    @utils.timeit
    def run_inference(self, inference: InferenceConfig, images: list[Image.Image], face_expression: FaceExpression | None = None):
        if not images:
            images = [Image.new("RGB", (inference.width, inference.height), (0, 0, 0))]

        seed = inference.seed or secrets.randbelow(2**32)
        generator = torch.Generator(device=self.device).manual_seed(seed)

        logger.info(f"Using seed {seed}")

        with torch.no_grad():
            if face_expression and face_expression.enabled:
                prompt_embeds, prompt_embeds_mask = self._build_expression_embeds(inference, face_expression, images)
                img = self.pipeline(
                    image=images,
                    prompt_embeds=prompt_embeds,
                    prompt_embeds_mask=prompt_embeds_mask,
                    height=inference.height,
                    width=inference.width,
                    generator=generator,
                    true_cfg_scale=0,
                    num_inference_steps=inference.numSteps,
                ).images[0]
            else:
                img = self.pipeline(
                    image=images,
                    prompt=inference.prompt,
                    negative_prompt=inference.negativePrompt if inference.negativePrompt or inference.guidanceScale > 1 else None,
                    height=inference.height,
                    width=inference.width,
                    generator=generator,
                    true_cfg_scale=inference.guidanceScale,
                    num_inference_steps=inference.numSteps,
                ).images[0]

        return img, seed


# ---------------------------------------------------------------------------
# Pool API
# ---------------------------------------------------------------------------

def load_pipeline(n: int = 1, base_idx: int = 0):
    for i in range(n):
        inst = _PipelineInstance(base_idx + i)
        inst.load()
        _pool.put(inst)


@contextmanager
def acquire_pipeline():
    """Lease one pipeline instance from the pool. Blocks until one is available."""
    inst = _pool.get()
    try:
        yield inst
    finally:
        _pool.put(inst)
