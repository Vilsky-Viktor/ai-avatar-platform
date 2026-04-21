"""
LoRA training for QwenImageEditPlusPipeline using DreamBooth-style flow-matching loss.

References:
  diffusers/examples/dreambooth/train_dreambooth_lora_qwen_image.py
"""

import copy
import math
import os
from dataclasses import dataclass
from pathlib import Path

import bitsandbytes as bnb
import torch
from peft import LoraConfig
from peft.utils import get_peft_model_state_dict
from PIL import Image
from torch.utils.data import DataLoader

from diffusers import (
    AutoencoderKLQwenImage,
    FlowMatchEulerDiscreteScheduler,
    QwenImagePipeline,
    QwenImageTransformer2DModel,
)
from diffusers.optimization import get_scheduler
from diffusers.training_utils import (
    cast_training_params,
    compute_density_for_timestep_sampling,
    compute_loss_weighting_for_sd3,
    free_memory,
    _collate_lora_metadata,
)
from transformers import Qwen2Tokenizer, Qwen2_5_VLForConditionalGeneration

from .dataset import TrainingDataset, collate_fn
from .logger import logger
from .models import InferenceConfig

QWEN_MODEL_PATH = os.environ.get("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")

# LoRA targets — image stream + text stream projections for maximum fidelity
LORA_TARGET_MODULES = [
    "to_q", "to_k", "to_v", "to_out.0",  # image stream
    "add_q_proj", "add_k_proj", "add_v_proj", "to_add_out",  # text stream
]


@dataclass
class SharedComponents:
    scheduler: FlowMatchEulerDiscreteScheduler
    vae: AutoencoderKLQwenImage
    vae_scale_factor: int
    text_pipeline: QwenImagePipeline
    weight_dtype: torch.dtype


def load_shared_components() -> SharedComponents:
    """Load VAE, scheduler, tokenizer and text encoder once at startup."""
    weight_dtype = torch.bfloat16
    device = torch.device("cuda")

    logger.info("Loading scheduler ...")
    scheduler = FlowMatchEulerDiscreteScheduler.from_pretrained(
        QWEN_MODEL_PATH, subfolder="scheduler", shift=3.0
    )

    logger.info("Loading VAE ...")
    vae = AutoencoderKLQwenImage.from_pretrained(
        QWEN_MODEL_PATH, subfolder="vae"
    ).to(device=device, dtype=weight_dtype)
    vae.requires_grad_(False)
    vae_scale_factor = 2 ** len(vae.temperal_downsample)
    vae.to("cpu")

    logger.info("Loading text encoder ...")
    tokenizer = Qwen2Tokenizer.from_pretrained(QWEN_MODEL_PATH, subfolder="tokenizer")
    text_encoder = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        QWEN_MODEL_PATH, subfolder="text_encoder", torch_dtype=weight_dtype
    )
    text_encoder.requires_grad_(False)

    text_pipeline = QwenImagePipeline.from_pretrained(
        QWEN_MODEL_PATH,
        vae=None,
        transformer=None,
        tokenizer=tokenizer,
        text_encoder=text_encoder,
        scheduler=None,
    )

    logger.info("Shared components loaded — keeping on CPU until needed")
    return SharedComponents(
        scheduler=scheduler,
        vae=vae,
        vae_scale_factor=vae_scale_factor,
        text_pipeline=text_pipeline,
        weight_dtype=weight_dtype,
    )


def train_lora(
    images: list[Image.Image],
    prompts: list[str],
    config: InferenceConfig,
    out_dir: Path,
    shared: SharedComponents,
    num_buckets: int = 1,
) -> Path:
    """
    Train a LoRA on the given images and save weights to out_dir.
    Returns out_dir on success.
    """
    device = torch.device("cuda")
    weight_dtype = shared.weight_dtype
    scheduler_copy = copy.deepcopy(shared.scheduler)

    # ── 1. Load transformer ───────────────────────────────────────────────────
    logger.info("Loading transformer ...")
    transformer = QwenImageTransformer2DModel.from_pretrained(
        QWEN_MODEL_PATH, subfolder="transformer", torch_dtype=weight_dtype
    ).to(device)
    transformer.requires_grad_(False)
    transformer.enable_gradient_checkpointing()

    # ── 2. Inject LoRA ────────────────────────────────────────────────────────
    logger.info(f"Injecting LoRA: rank={config.rank}, alpha={config.loraAlpha}")
    lora_config = LoraConfig(  # type: ignore[call-arg]
        r=config.rank,
        lora_alpha=config.loraAlpha,
        lora_dropout=0.0,
        init_lora_weights="gaussian",
        target_modules=LORA_TARGET_MODULES,
    )
    transformer.add_adapter(lora_config)
    cast_training_params([transformer], dtype=torch.float32)

    trainable_params = [p for p in transformer.parameters() if p.requires_grad]
    logger.info(f"Trainable LoRA parameters: {sum(p.numel() for p in trainable_params):,}")

    # ── 3. Dataset & dataloader ───────────────────────────────────────────────
    logger.info(f"Building dataset from {len(images)} images, num_buckets={num_buckets} ...")
    dataset = TrainingDataset(
        images=images,
        prompts=prompts,
        num_buckets=num_buckets,
        repeats=max(1, math.ceil(config.numSteps * 1 / max(len(images), 1))),
    )
    dataloader = DataLoader(
        dataset,
        batch_size=1,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=0,
    )

    # ── 4. Pre-cache latents & text embeddings ────────────────────────────────
    logger.info("Caching latents and text embeddings ...")
    latents_cache: list[torch.Tensor] = []
    prompt_embeds_cache: list[torch.Tensor] = []
    prompt_embeds_mask_cache: list[torch.Tensor] = []

    vae = shared.vae.to(device)
    latents_mean = torch.tensor(vae.config.latents_mean).view(1, vae.config.z_dim, 1, 1, 1).to(device)
    latents_std = 1.0 / torch.tensor(vae.config.latents_std).view(1, vae.config.z_dim, 1, 1, 1).to(device)
    shared.text_pipeline.to(device)

    with torch.no_grad():
        for batch in dataloader:
            # VAE expects (B, C, T, H, W) — add time dim for single-frame images
            px = batch["pixel_values"].to(device=device, dtype=vae.dtype).unsqueeze(2)
            lat = vae.encode(px).latent_dist.sample()
            lat = (lat - latents_mean) * latents_std
            latents_cache.append(lat.to(dtype=weight_dtype))

            embeds, mask = shared.text_pipeline.encode_prompt(
                prompt=batch["prompts"],
                device=device,
                max_sequence_length=256,
            )
            prompt_embeds_cache.append(embeds)
            prompt_embeds_mask_cache.append(mask)

    # Move shared components back to CPU — transformer takes over the GPU
    shared.text_pipeline.to("cpu")
    shared.vae.to("cpu")
    free_memory()

    # ── 5. Optimizer & LR scheduler ──────────────────────────────────────────
    optimizer = bnb.optim.AdamW8bit(
        trainable_params,
        lr=config.learningRate,
        betas=(0.9, 0.999),
        weight_decay=1e-4,
        eps=1e-8,
    )
    lr_scheduler = get_scheduler(
        "constant_with_warmup",
        optimizer=optimizer,
        num_warmup_steps=max(1, config.numSteps // 20),
        num_training_steps=config.numSteps,
    )

    # ── 6. Training loop ──────────────────────────────────────────────────────
    logger.info(f"Starting training: {config.numSteps} steps, grad_accum={config.gradientAccumulationSteps}, lr={config.learningRate}")
    transformer.train()
    global_step = 0
    accum_loss = 0.0
    optimizer.zero_grad()

    epoch = 0
    while global_step < config.numSteps:
        epoch += 1
        cache_len = len(latents_cache)

        for cache_idx in range(cache_len):
            if global_step >= config.numSteps:
                break

            model_input = latents_cache[cache_idx].to(device)
            prompt_embeds = prompt_embeds_cache[cache_idx].to(device)
            prompt_mask = prompt_embeds_mask_cache[cache_idx]
            if prompt_mask is not None:
                prompt_mask = prompt_mask.to(device)

            bsz = model_input.shape[0]

            # Sample timestep with logit-normal weighting (mode_scale=1.29 emphasises mid-noise)
            u = compute_density_for_timestep_sampling(
                weighting_scheme="logit_normal",
                batch_size=bsz,
                logit_mean=0.0,
                logit_std=1.0,
                mode_scale=1.29,
            )
            indices = (u * scheduler_copy.config.num_train_timesteps).long()
            timesteps = scheduler_copy.timesteps[indices].to(device)

            noise = torch.randn_like(model_input)
            sigmas = _get_sigmas(timesteps, scheduler_copy, n_dim=model_input.ndim, dtype=model_input.dtype, device=device)
            noisy_model_input = (1.0 - sigmas) * model_input + sigmas * noise

            # Pack latents for transformer input
            noisy_packed = noisy_model_input.permute(0, 2, 1, 3, 4)
            H = model_input.shape[3]
            W = model_input.shape[4]
            noisy_packed = QwenImagePipeline._pack_latents(
                noisy_packed,
                batch_size=bsz,
                num_channels_latents=model_input.shape[1],
                height=H,
                width=W,
            )
            img_shapes = [[(1, H // 2, W // 2)]] * bsz

            model_pred = transformer(
                hidden_states=noisy_packed,
                encoder_hidden_states=prompt_embeds,
                encoder_hidden_states_mask=prompt_mask,
                timestep=timesteps / 1000,
                img_shapes=img_shapes,
                return_dict=False,
            )[0]
            model_pred = QwenImagePipeline._unpack_latents(
                model_pred,
                height=H * shared.vae_scale_factor,
                width=W * shared.vae_scale_factor,
                vae_scale_factor=shared.vae_scale_factor,
            )

            weighting = compute_loss_weighting_for_sd3(
                weighting_scheme="logit_normal", sigmas=sigmas
            )
            target = noise - model_input
            loss = torch.mean(
                (weighting.float() * (model_pred.float() - target.float()) ** 2).reshape(bsz, -1), 1
            ).mean()

            (loss / config.gradientAccumulationSteps).backward()
            accum_loss += loss.item()

            if (cache_idx + 1) % config.gradientAccumulationSteps == 0 or cache_idx == cache_len - 1:
                torch.nn.utils.clip_grad_norm_(trainable_params, config.clipGradNorm)
                optimizer.step()
                lr_scheduler.step()
                optimizer.zero_grad()
                global_step += 1
                avg_loss = accum_loss / config.gradientAccumulationSteps
                accum_loss = 0.0

                if global_step % 100 == 0 or global_step == config.numSteps:
                    lr = lr_scheduler.get_last_lr()[0]
                    logger.info(f"Step {global_step}/{config.numSteps}  loss={avg_loss:.4f}  lr={lr:.2e}")

    # ── 7. Save LoRA weights ──────────────────────────────────────────────────
    logger.info(f"Saving LoRA weights to {out_dir} ...")
    lora_state_dict = get_peft_model_state_dict(transformer)
    QwenImagePipeline.save_lora_weights(
        str(out_dir),
        transformer_lora_layers=lora_state_dict,
        **_collate_lora_metadata({"transformer": transformer}),
    )
    logger.info("LoRA saved.")

    # Cleanup transformer only — shared components are kept alive for next job
    del transformer
    free_memory()

    return out_dir


def _get_sigmas(
    timesteps: torch.Tensor,
    scheduler,
    n_dim: int,
    dtype:  torch.dtype,
    device: torch.device,
) -> torch.Tensor:
    sigmas = scheduler.sigmas.to(device=device, dtype=dtype)
    schedule_timesteps = scheduler.timesteps.to(device)
    timesteps = timesteps.to(device)
    step_indices = [(schedule_timesteps == t).nonzero().item() for t in timesteps]
    sigma = sigmas[step_indices].flatten()
    while len(sigma.shape) < n_dim:
        sigma = sigma.unsqueeze(-1)
    return sigma
