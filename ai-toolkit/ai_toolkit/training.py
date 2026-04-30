import copy
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from ai_toolkit.logger import logger

AI_TOOLKIT_PATH = os.environ.get("AI_TOOLKIT_PATH", "/opt/ai-toolkit")
LOCAL_MODELS_BASE = os.environ.get("LOCAL_MODELS_BASE", "/workspace/models")
LORA_OUTPUT_NAME = "lora"


def run_training(toolkit_config: dict, out_dir: Path, images_dir: Path, control_dir: Path, model_name: str):
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

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(config, f)
        config_path = f.name

    logger.info(f"Starting training subprocess (output: {out_dir})")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "ai_toolkit.training", config_path],
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Training subprocess exited with code {result.returncode}")
    finally:
        Path(config_path).unlink(missing_ok=True)

    logger.info("Training subprocess completed, GPU memory released")


if __name__ == "__main__":
    if AI_TOOLKIT_PATH not in sys.path:
        sys.path.insert(0, AI_TOOLKIT_PATH)

    from toolkit.job import run_job  # type: ignore[import]

    with open(sys.argv[1]) as f:
        config = json.load(f)

    run_job(config)
