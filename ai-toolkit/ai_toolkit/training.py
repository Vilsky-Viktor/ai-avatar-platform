import copy
import os
import sys
from pathlib import Path

from ai_toolkit.logger import logger

AI_TOOLKIT_PATH = os.environ.get("AI_TOOLKIT_PATH", "/opt/ai-toolkit")
LOCAL_MODELS_BASE = os.environ.get("LOCAL_MODELS_BASE", "/workspace/models")
LORA_OUTPUT_NAME = "lora"


def run_training(toolkit_config: dict, job_id: str, out_dir: Path, images_dir: Path, control_dir: Path, model_name: str):
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
            model["name_or_path"] = str(Path(LOCAL_MODELS_BASE) / model_name)

    if AI_TOOLKIT_PATH not in sys.path:
        sys.path.insert(0, AI_TOOLKIT_PATH)

    from toolkit.job import run_job
    logger.info(f"Starting AI toolkit training (output: {out_dir})")
    run_job(config)
    logger.info("AI toolkit training completed")
