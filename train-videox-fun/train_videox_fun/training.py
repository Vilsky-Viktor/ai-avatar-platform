import os
import subprocess
from pathlib import Path

from train_videox_fun.logger import logger
from train_videox_fun.models import Toolkit

VIDEOX_FUN_PATH = os.environ.get("VIDEOX_FUN_PATH", "/opt/videox-fun")
LOCAL_MODELS_BASE = os.environ.get("LOCAL_MODELS_BASE", "/workspace/models")

CONFIG_PATH = os.path.join(VIDEOX_FUN_PATH, "config/wan2.2/wan_civitai_t2v.yaml")
TRAIN_SCRIPT = os.path.join(VIDEOX_FUN_PATH, "scripts/wan2.2_fun/train_lora.py")


def run_training(
    model_name: str,
    dataset_dir: Path,
    meta_path: Path,
    output_dir: Path,
    toolkit: Toolkit,
) -> dict[str, Path]:
    """
    Train LoRA for both high-noise and low-noise transformer boundaries.
    Returns a dict mapping boundary name to the saved .safetensors path.
    """
    process = toolkit.config.process[0]
    rank = process.network.linear
    network_alpha = process.network.linear_alpha
    lr = process.train.lr
    resolution = process.datasets[0].resolution[0]
    max_train_steps = process.train.steps
    checkpointing_steps = max_train_steps + 1
    model_path = str(Path(LOCAL_MODELS_BASE) / model_name)

    train_mode = "inpaint" if "-inp" in model_name else "normal"

    results: dict[str, Path] = {}
    for boundary in ("high", "low"):
        boundary_output_dir = output_dir / boundary
        boundary_output_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            "accelerate", "launch",
            "--num_processes=1",
            "--mixed_precision=bf16",
            TRAIN_SCRIPT,
            f"--config_path={CONFIG_PATH}",
            f"--pretrained_model_name_or_path={model_path}",
            f"--train_data_dir={dataset_dir}",
            f"--train_data_meta={meta_path}",
            f"--image_sample_size={resolution}",
            f"--video_sample_size={resolution}",
            f"--token_sample_size={resolution}",
            "--video_sample_n_frames=1",
            "--train_batch_size=1",
            "--gradient_accumulation_steps=1",
            "--dataloader_num_workers=4",
            f"--max_train_steps={max_train_steps}",
            f"--checkpointing_steps={checkpointing_steps}",
            f"--learning_rate={lr}",
            "--seed=42",
            f"--output_dir={boundary_output_dir}",
            "--gradient_checkpointing",
            "--mixed_precision=bf16",
            "--adam_weight_decay=3e-2",
            "--adam_epsilon=1e-10",
            "--vae_mini_batch=1",
            "--max_grad_norm=0.05",
            f"--train_mode={train_mode}",
            f"--boundary_type={boundary}",
            f"--rank={rank}",
            f"--network_alpha={network_alpha}",
            "--target_name=q,k,v,ffn.0,ffn.2",
            "--use_peft_lora",
            "--low_vram",
        ]

        logger.info(
            f"Starting training boundary={boundary}, steps={max_train_steps}, "
            f"rank={rank}, lr={lr}, resolution={resolution}"
        )
        result = subprocess.run(
            cmd,
            check=False,
            cwd=VIDEOX_FUN_PATH,
            env={**os.environ, "PYTHONPATH": VIDEOX_FUN_PATH},
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"Training failed for boundary={boundary} (exit code {result.returncode})"
            )

        lora_path = _find_final_checkpoint(boundary_output_dir, max_train_steps)
        results[boundary] = lora_path
        logger.info(f"boundary={boundary} LoRA saved at {lora_path}")

    return results


def _find_final_checkpoint(output_dir: Path, max_train_steps: int) -> Path:
    expected = output_dir / f"checkpoint-{max_train_steps}.safetensors"
    if expected.exists():
        return expected

    candidates = sorted(output_dir.glob("checkpoint-*.safetensors"), key=_step_from_path)
    if not candidates:
        raise RuntimeError(f"No checkpoint found in {output_dir}")
    return candidates[-1]


def _step_from_path(p: Path) -> int:
    try:
        return int(p.stem.split("-")[1])
    except (IndexError, ValueError):
        return 0
