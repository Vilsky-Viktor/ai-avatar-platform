import logging
import math
import os
import queue
import secrets
import warnings
from contextlib import contextmanager
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

_pool: queue.Queue["_PipelineInstance"] = queue.Queue()


class _PipelineInstance:
    def __init__(self, idx: int):
        self.idx = idx
        self.pipeline = None
        self.device = None
        self._lora_cache: dict[str, float] = {}

    @utils.timeit
    def load(self):
        logger.info(f"[instance {self.idx}] Loading Qwen Image Edit 2511 pipeline ...")
        self.device = "cuda"

        self.pipeline = QwenImageEditPlusPipeline.from_pretrained(
            QWEN_MODEL_PATH,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
        )

        logger.info(f"[instance {self.idx}] Loading model into VRAM ...")
        self.pipeline.to(device=self.device)
        logger.info(f"[instance {self.idx}] Model loaded into VRAM")

        self.pipeline.set_progress_bar_config(disable=True)
        logger.info(f"[instance {self.idx}] Pipeline ready")

    def clear_cache(self):
        torch.cuda.empty_cache()

    def _adapter_name(self, path: str) -> str:
        return path.replace("/", "__").replace(".", "_")

    @utils.timeit
    def sync_loras(self, loras: list[LoraConfig]):
        incoming: dict[str, float] = {lora.path: lora.scale for lora in loras}

        to_remove = [path for path in self._lora_cache if path not in incoming]
        to_update = [path for path in self._lora_cache if path in incoming and incoming[path] != self._lora_cache[path]]
        to_load   = [lora for lora in loras if lora.path not in self._lora_cache]

        if not to_remove and not to_update and not to_load:
            logger.info(f"[instance {self.idx}] LoRA cache hit — all adapters already loaded with correct scales")
            return

        if to_remove:
            logger.info(f"[instance {self.idx}] Removing {len(to_remove)} stale LoRA(s): {[Path(n).name for n in to_remove]}")
            self.pipeline.delete_adapters([self._adapter_name(p) for p in to_remove])
            for path in to_remove:
                del self._lora_cache[path]

        for lora in to_load:
            local_path   = str(Path("/workspace") / lora.path)
            adapter_name = self._adapter_name(lora.path)
            logger.info(f"[instance {self.idx}]   [load] {Path(lora.path).name} scale={lora.scale}")
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=RuntimeWarning, module="peft")
                warnings.filterwarnings("ignore", category=UserWarning,    module="peft")
                self.pipeline.load_lora_weights(local_path, adapter_name=adapter_name, weight_name=lora.filename)
            self._lora_cache[lora.path] = lora.scale

        if to_update:
            logger.info(f"[instance {self.idx}] Updating scale for {len(to_update)} LoRA(s): {[Path(n).name for n in to_update]}")
            for path in to_update:
                self._lora_cache[path] = incoming[path]

        active_names  = [self._adapter_name(lora.path) for lora in loras]
        active_scales = [lora.scale for lora in loras]
        self.pipeline.set_adapters(active_names, adapter_weights=active_scales)
        logger.info(f"[instance {self.idx}] LoRAs synced — {len(active_names)} active: {[Path(lora.path).name for lora in loras]}")

    @utils.timeit
    def clear_loras(self):
        if not self._lora_cache:
            return
        try:
            self.pipeline.delete_adapters([self._adapter_name(p) for p in self._lora_cache])
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

    def _build_expression_embeds(self, job_input: JobInput, images: list[Image.Image]):
        expression = job_input.faceExpression.type
        scale      = job_input.faceExpression.scale
        context    = job_input.inference.prompt

        prompt_tgt = f"Edit the person to show a {expression} expression. {context}".strip()
        prompt_neu = f"Edit the person to show a neutral expression. {context}".strip()

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

        prompt_embeds = embed_neu + scale * (embed_tgt - embed_neu)

        if mask_tgt is None:
            mask_tgt = torch.ones(prompt_embeds.shape[:2], dtype=torch.long, device=prompt_embeds.device)

        return prompt_embeds, mask_tgt

    @utils.timeit
    def run_inference(self, job_input: JobInput, images: list[Image.Image]):
        if not images:
            images = [Image.new("RGB", (job_input.inference.width, job_input.inference.height), (255, 255, 255))]

        seed      = job_input.inference.seed or secrets.randbelow(2**32)
        generator = torch.Generator(device=self.device).manual_seed(seed)

        logger.info(f"Using seed {seed}")

        with torch.no_grad():
            if job_input.faceExpression.enabled:
                prompt_embeds, prompt_embeds_mask = self._build_expression_embeds(job_input, images)
                img = self.pipeline(
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
                img = self.pipeline(
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


# ---------------------------------------------------------------------------
# Pool API
# ---------------------------------------------------------------------------

def load_pipeline(n: int = 1):
    for i in range(n):
        inst = _PipelineInstance(i)
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
