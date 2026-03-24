
import subprocess
import tempfile
import os
import sys

from PIL import Image
import gen_ti2i_controlnet.utils as utils_module
from gen_ti2i_controlnet.logger import get_logger


FACEFUSION_DIR = os.getenv("FACEFUSION_DIR")
DEVICE = "cuda"

# Processor models (face swapper + enhancer)
FACEFUSION_PROCESSOR_MODELS = [
    ("facefusion.processors.modules.face_swapper.core", ["hyperswap_1a_256", "hyperswap_1b_256"]),
    ("facefusion.processors.modules.face_enhancer.core", ["gpen_bfr_2048"]),
]

# Analyser models (face detection pipeline — needed for every headless run)
FACEFUSION_ANALYSER_MODELS = [
    ("facefusion.face_detector",   ["yolo_face"]),
    ("facefusion.face_landmarker", ["2dfan4", "fan_68_5"]),
    ("facefusion.face_recognizer", ["arcface"]),
    ("facefusion.face_masker",     ["xseg_1", "bisenet_resnet_34"]),
]

logger = get_logger(__name__)


def _download_model(model_set: dict, model_name: str,
                    conditional_download_hashes, conditional_download_sources) -> None:
    if model_name not in model_set:
        logger.warning(f"No model definition found for: {model_name}")
        return
    logger.info(f"Ensuring {model_name} is downloaded...")
    hash_ok = conditional_download_hashes(model_set[model_name]["hashes"])
    if not hash_ok:
        logger.error(f"{model_name} hash download failed — skipping source download")
        return
    source_ok = conditional_download_sources(model_set[model_name]["sources"])
    if source_ok:
        logger.info(f"{model_name} ready")
    else:
        logger.error(f"{model_name} source download or validation failed — model may not work")


def download_models():
    all_groups = FACEFUSION_PROCESSOR_MODELS + FACEFUSION_ANALYSER_MODELS
    logger.info(f"Ensuring FaceFusion models are downloaded ...")

    if FACEFUSION_DIR not in sys.path:
        sys.path.insert(0, FACEFUSION_DIR)

    try:
        import importlib
        from facefusion import state_manager
        from facefusion.choices import download_providers
        from facefusion.download import conditional_download_hashes, conditional_download_sources
        state_manager.set_item('download_providers', download_providers)

        for module_path, model_names in all_groups:
            module = importlib.import_module(module_path)
            model_set = module.create_static_model_set('full')
            for model_name in model_names:
                _download_model(model_set, model_name,
                                conditional_download_hashes, conditional_download_sources)

    except Exception as e:
        logger.error(f"Failed to download FaceFusion models: {e}", exc_info=True)

@utils_module.timeit
def swap_face(source_images: list[Image.Image], target_image: Image.Image, swapper_params: dict, enhancer_params: dict) -> Image.Image:  
    if not swapper_params["enabled"] and enhancer_params["enabled"]:
        return target_image
    
    logger.info(f"Swapping faces ... Fase swap: {swapper_params}. Face enhancement: {enhancer_params}")  
    source_image = source_images[swapper_params["referenceIdx"]]

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as src_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tgt_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as out_tmp:
        source_path = src_tmp.name
        target_path = tgt_tmp.name
        output_path = out_tmp.name

    try:
        source_image.save(source_path)
        target_image.save(target_path)

        processors = []
        if swapper_params["enabled"]:
            processors.append("face_swapper")
        if enhancer_params["enabled"]:
            processors.append("face_enhancer")

        cmd = [
            "python", f"{FACEFUSION_DIR}/facefusion.py", "headless-run",
            "--source-paths", source_path,
            "--target-path", target_path,
            "--output-path", output_path,
            "--processors", *processors,
            "--execution-providers", DEVICE,
            "--output-audio-quality", "100",
            "--log-level", "error"
        ]

        if swapper_params["enabled"]:
            cmd += [
                "--face-swapper-model", swapper_params["model"],
                "--face-swapper-weight", str(swapper_params["weight"]),
                "--face-swapper-pixel-boost", str(swapper_params["pixelBoost"]),
            ]

        if enhancer_params["enabled"]:
            cmd += [
                "--face-enhancer-model", enhancer_params["model"],
                "--face-enhancer-blend", str(enhancer_params["blend"]),
                "--face-enhancer-weight", str(enhancer_params["weight"]),
            ]

        subprocess.run(cmd, check=True, cwd=FACEFUSION_DIR)

        return Image.open(output_path).copy()
    finally:
        os.unlink(source_path)
        os.unlink(target_path)
        os.unlink(output_path)