import copy
import os
import sys
from pathlib import Path

from ai_toolkit.logger import logger

AI_TOOLKIT_PATH = os.environ.get("AI_TOOLKIT_PATH", "/workspace/ai-toolkit")
QWEN_MODEL_PATH = os.environ.get("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")
LORA_OUTPUT_NAME = "lora"


def run_training(toolkit_config: dict, job_id: str, out_dir: Path, images_dir: Path, control_dir: Path):
    config = copy.deepcopy(toolkit_config)

    cfg = config.setdefault("config", {})
    cfg["name"] = LORA_OUTPUT_NAME

    for proc in cfg.get("process", []):
        proc["training_folder"] = str(out_dir)
        for ds in proc.get("datasets", []):
            ds["folder_path"] = str(images_dir)
            ds["control_path"] = str(control_dir)
        model = proc.setdefault("model", {})
        if not model.get("name_or_path"):
            model["name_or_path"] = QWEN_MODEL_PATH

    if AI_TOOLKIT_PATH not in sys.path:
        sys.path.insert(0, AI_TOOLKIT_PATH)

    from toolkit.job import run_job
    logger.info(f"Starting AI toolkit training (output: {out_dir})")
    run_job(config)
    logger.info("AI toolkit training completed")
