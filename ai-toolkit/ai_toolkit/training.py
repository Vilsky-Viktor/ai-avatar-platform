import copy
import multiprocessing
import os
import sys
import traceback
from pathlib import Path

from ai_toolkit.logger import logger

AI_TOOLKIT_PATH = os.environ.get("AI_TOOLKIT_PATH", "/opt/ai-toolkit")
LOCAL_MODELS_BASE = os.environ.get("LOCAL_MODELS_BASE", "/workspace/models")
LORA_OUTPUT_NAME = "lora"

if AI_TOOLKIT_PATH not in sys.path:
    sys.path.insert(0, AI_TOOLKIT_PATH)

from toolkit.job import run_job  # type: ignore[import]


def _training_subprocess(
    toolkit_config: dict,
    out_dir_str: str,
    images_dir_str: str,
    control_dir_str: str,
    model_name: str,
    error_queue: "multiprocessing.Queue[str | None]",
):
    """Runs inside a subprocess so the CUDA context is fully released on exit."""
    try:
        config = copy.deepcopy(toolkit_config)
        cfg = config.setdefault("config", {})
        cfg["name"] = LORA_OUTPUT_NAME

        for proc in cfg.get("process", []):
            proc["training_folder"] = out_dir_str
            for ds in proc.get("datasets", []):
                ds["folder_path"] = images_dir_str
                ds["control_path"] = control_dir_str
            model = proc.setdefault("model", {})
            if not model.get("name_or_path"):
                model["name_or_path"] = str(Path(LOCAL_MODELS_BASE) / model_name)

        run_job(config)
        error_queue.put(None)
    except Exception:
        error_queue.put(traceback.format_exc())
        sys.exit(1)


def run_training(toolkit_config: dict, job_id: str, out_dir: Path, images_dir: Path, control_dir: Path, model_name: str):
    ctx = multiprocessing.get_context("spawn")
    error_queue: multiprocessing.Queue = ctx.Queue()

    p = ctx.Process(
        target=_training_subprocess,
        args=(toolkit_config, str(out_dir), str(images_dir), str(control_dir), model_name, error_queue),
    )

    logger.info(f"Starting training subprocess (output: {out_dir})")
    p.start()
    p.join()

    error_msg = error_queue.get() if not error_queue.empty() else None

    if p.exitcode != 0:
        raise RuntimeError(error_msg or f"Training subprocess exited with code {p.exitcode}")

    logger.info("Training subprocess completed, GPU memory released")
