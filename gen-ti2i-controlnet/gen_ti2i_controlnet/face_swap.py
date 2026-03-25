import os
import sys
import importlib

import numpy as np
import onnxruntime as _ort
import torch
from PIL import Image
import gen_ti2i_controlnet.utils as utils_module
from gen_ti2i_controlnet.logger import get_logger


FACEFUSION_DIR = os.getenv("FACEFUSION_DIR")
DEVICE = "cuda"

if FACEFUSION_DIR and FACEFUSION_DIR not in sys.path:
    sys.path.insert(0, FACEFUSION_DIR)

from facefusion import state_manager, face_detector, face_landmarker, face_recognizer, face_masker
from facefusion import execution as ff_execution
from facefusion.choices import download_providers
from facefusion.download import conditional_download_hashes, conditional_download_sources
from facefusion.face_analyser import get_many_faces, get_one_face
from facefusion.processors.modules.face_swapper import core as face_swapper_core
from facefusion.processors.modules.face_enhancer import core as face_enhancer_core

# Redirect TRT engine cache to persistent storage so engines survive pod restarts
ff_execution.resolve_cache_path = lambda: f"/workspace/.caches/{_ort.get_version_string()}"

# Processor models (face swapper + enhancer)
FACEFUSION_PROCESSOR_MODELS = [
    ("facefusion.processors.modules.face_swapper.core", ["hyperswap_1a_256", "hyperswap_1b_256"]),
    ("facefusion.processors.modules.face_enhancer.core", ["gpen_bfr_2048"]),
]

# Analyser models (face detection pipeline)
FACEFUSION_ANALYSER_MODELS = [
    ("facefusion.face_detector",   ["yolo_face"]),
    ("facefusion.face_landmarker", ["2dfan4", "fan_68_5"]),
    ("facefusion.face_recognizer", ["arcface"]),
    ("facefusion.face_masker",     ["xseg_1", "bisenet_resnet_34"]),
]

logger = get_logger(__name__)


def _pil_to_vision_frame(image: Image.Image) -> np.ndarray:
    """PIL RGB → numpy BGR (VisionFrame format used by FaceFusion)"""
    return np.array(image.convert("RGB"))[:, :, ::-1].copy()


def _vision_frame_to_pil(frame: np.ndarray) -> Image.Image:
    """numpy BGR → PIL RGB"""
    return Image.fromarray(frame[:, :, ::-1])


def _init_state(swapper_model: str = None, swapper_pixel_boost: str = "1024x1024",
                swapper_weight: float = 1.0, enhancer_model: str = None,
                enhancer_blend: float = 80, enhancer_weight: float = 1.0):
    state_manager.set_item("download_providers", download_providers)
    state_manager.set_item("execution_providers", ["tensorrt", "cuda"])
    state_manager.set_item("execution_device_ids", [0])
    state_manager.set_item("video_memory_strategy", "tolerant")

    # Face detection
    state_manager.set_item("face_detector_model", "yolo_face")
    state_manager.set_item("face_detector_size", "640x640")
    state_manager.set_item("face_detector_angles", [0])
    state_manager.set_item("face_detector_score", 0.5)
    state_manager.set_item("face_detector_margin", [0, 0, 0, 0])
    state_manager.set_item("face_landmarker_model", "2dfan4")
    state_manager.set_item("face_landmarker_score", 0.5)
    state_manager.set_item("face_recognizer_model", "arcface")

    # Face masking
    state_manager.set_item("face_occluder_model", "xseg_1")
    state_manager.set_item("face_parser_model", "bisenet_resnet_34")
    state_manager.set_item("face_mask_types", ["box", "occlusion"])
    state_manager.set_item("face_mask_blur", 0.3)
    state_manager.set_item("face_mask_padding", (0, 0, 0, 0))
    state_manager.set_item("face_mask_areas", [])
    state_manager.set_item("face_mask_regions", [
        "skin", "left-eyebrow", "right-eyebrow", "left-eye", "right-eye",
        "glasses", "nose", "mouth", "upper-lip", "lower-lip",
    ])

    if swapper_model:
        state_manager.set_item("face_swapper_model", swapper_model)
        state_manager.set_item("face_swapper_pixel_boost", swapper_pixel_boost)
        state_manager.set_item("face_swapper_weight", swapper_weight)

    if enhancer_model:
        state_manager.set_item("face_enhancer_model", enhancer_model)
        state_manager.set_item("face_enhancer_blend", enhancer_blend)
        state_manager.set_item("face_enhancer_weight", enhancer_weight)


def _download_model(model_set: dict, model_name: str) -> None:
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
    logger.info("Ensuring FaceFusion models are downloaded ...")

    try:
        state_manager.set_item("download_providers", download_providers)
        state_manager.set_item("execution_providers", ["tensorrt", "cuda"])
        state_manager.set_item("execution_device_ids", [0])

        for module_path, model_names in all_groups:
            module = importlib.import_module(module_path)
            model_set = module.create_static_model_set("full")
            for model_name in model_names:
                _download_model(model_set, model_name)

    except Exception as e:
        logger.error(f"Failed to download FaceFusion models: {e}", exc_info=True)


def load_processors():
    """Load FaceFusion ONNX models into GPU memory. Call once at startup after download_models()."""
    logger.info("Loading FaceFusion processors into GPU memory ...")

    try:
        _init_state(
            swapper_model="hyperswap_1b_256",
            enhancer_model="gpen_bfr_2048",
        )

        logger.info("loading face detector ...")
        face_detector.get_inference_pool()
        logger.info("loading face landmarker ...")
        face_landmarker.get_inference_pool()
        logger.info("loading face recognizer ...")
        face_recognizer.get_inference_pool()
        logger.info("loading face masker ...")
        face_masker.get_inference_pool()
        logger.info("loading face swapper ...")
        face_swapper_core.get_inference_pool()
        logger.info("loading face enhancer ...")
        face_enhancer_core.get_inference_pool()

        logger.info("FaceFusion processors loaded")
    except Exception as e:
        logger.error(f"Failed to load FaceFusion processors: {e}", exc_info=True)


def warmup(images: list):
    """Run a real face swap + enhance to pre-compile ONNX CUDA kernels."""
    if len(images) < 2:
        logger.warning("FaceFusion warmup skipped — need at least 2 dummy images")
        return
    logger.info("Warming up FaceFusion models ...")
    try:
        swapper_params = {
            "enabled": True,
            "model": "hyperswap_1b_256",
            "pixelBoost": "1024x1024",
            "weight": 1.0,
            "referenceIdx": 0,
        }
        enhancer_params = {
            "enabled": True,
            "model": "gpen_bfr_2048",
            "blend": 80,
            "weight": 1.0,
        }
        swap_face([images[0]], images[1], swapper_params, enhancer_params)
        logger.info("FaceFusion warmup complete")
    except Exception as e:
        logger.error(f"FaceFusion warmup failed: {e}", exc_info=True)


@utils_module.timeit
def swap_face(source_images: list[Image.Image], target_image: Image.Image,
              swapper_params: dict, enhancer_params: dict) -> Image.Image:
    if not swapper_params["enabled"] and not enhancer_params["enabled"]:
        return target_image

    logger.info(f"Swapping faces ... Face swap: {swapper_params}. Face enhancement: {enhancer_params}")

    source_image = source_images[swapper_params["referenceIdx"]]

    # Update state for this call's specific params
    if swapper_params["enabled"]:
        state_manager.set_item("face_swapper_model", swapper_params["model"])
        state_manager.set_item("face_swapper_pixel_boost", str(swapper_params["pixelBoost"]))
        state_manager.set_item("face_swapper_weight", float(swapper_params["weight"]))

    if enhancer_params["enabled"]:
        state_manager.set_item("face_enhancer_model", enhancer_params["model"])
        state_manager.set_item("face_enhancer_blend", float(enhancer_params["blend"]))
        state_manager.set_item("face_enhancer_weight", float(enhancer_params["weight"]))

    source_frame = _pil_to_vision_frame(source_image)
    target_frame = _pil_to_vision_frame(target_image)

    source_face = get_one_face(get_many_faces([source_frame]))
    target_face = get_one_face(get_many_faces([target_frame]))

    if source_face is None:
        logger.warning("No face detected in source image — skipping swap")
        return target_image
    if target_face is None:
        logger.warning("No face detected in target image — skipping swap")
        return target_image

    result_frame = target_frame

    if swapper_params["enabled"]:
        result_frame = face_swapper_core.swap_face(source_face, target_face, result_frame)

    if enhancer_params["enabled"]:
        result_face = get_one_face(get_many_faces([result_frame])) or target_face
        result_frame = face_enhancer_core.enhance_face(result_face, result_frame)

    return _vision_frame_to_pil(result_frame)
