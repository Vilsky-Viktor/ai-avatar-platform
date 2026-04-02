import os
import glob
import shutil
import time
import cv2
import numpy as np
import torch
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from typing import List
from insightface.app import FaceAnalysis
from insightface.utils import face_align
from scipy.spatial.distance import cosine

from .adaface import net as adaface_net
from gen_flux2_dev.utils import bytes_to_cv2, enhance_image
import gen_flux2_dev.utils as utils_module
import gen_flux2_dev.logger as log_module

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
INSIGHTFACE_MODEL    = os.getenv("INSIGHTFACE_MODEL", "buffalo_l")
INSIGHTFACE_DET_SIZE = (640, 640)
ADAFACE_MODEL_DIR    = os.getenv("ADAFACE_MODEL_DIR", "/workspace/models/adaface")
ADAFACE_ARCHITECTURE = os.getenv("ADAFACE_ARCHITECTURE", "ir_101")

EMBEDDING_CACHE_TTL      = int(os.getenv("EMBEDDING_CACHE_TTL", "3600"))
EMBEDDING_CACHE_MAX_SIZE = int(os.getenv("EMBEDDING_CACHE_MAX_SIZE", "500"))
FACE_CHECK_WORKERS       = int(os.getenv("FACE_CHECK_WORKERS", "10"))

logger = log_module.get_logger(__name__)

_face_app: FaceAnalysis | None = None
_adaface_model: adaface_net.Backbone | None = None
_id_embedding_cache: OrderedDict[int, tuple[np.ndarray | None, float]] = OrderedDict()
_executor: ThreadPoolExecutor = ThreadPoolExecutor(max_workers=FACE_CHECK_WORKERS)


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def _find_checkpoint() -> str:
    pattern = os.path.join(ADAFACE_MODEL_DIR, "*.ckpt")
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(
            f"No AdaFace checkpoint (*.ckpt) found in {ADAFACE_MODEL_DIR}."
        )
    return matches[0]


def get_app():
    global _face_app, _adaface_model

    # Guard against a partially-downloaded buffalo_l dir (no detection model)
    model_dir = f"/workspace/models/models/{INSIGHTFACE_MODEL}"
    det_prefixes = ["det_", "scrfd_", "retinaface_"]
    has_onnx = bool(glob.glob(os.path.join(model_dir, "*.onnx")))
    has_det  = any(glob.glob(os.path.join(model_dir, f"{p}*.onnx")) for p in det_prefixes)
    if os.path.isdir(model_dir) and (not has_onnx or not has_det):
        logger.warning(f"InsightFace model dir incomplete — clearing for re-download: {model_dir}")
        shutil.rmtree(model_dir)

    # SCRFD detector — detection only, recognition model intentionally skipped
    logger.info(f"Loading SCRFD detector ({INSIGHTFACE_MODEL})")
    _face_app = FaceAnalysis(
        name=INSIGHTFACE_MODEL,
        root="/workspace/models",
        allowed_modules=["detection"],
        providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
    )
    _face_app.prepare(ctx_id=0, det_size=INSIGHTFACE_DET_SIZE)
    logger.info("SCRFD detector loaded")

    # AdaFace recognition model
    ckpt_path = _find_checkpoint()
    logger.info(f"Loading AdaFace {ADAFACE_ARCHITECTURE} from {ckpt_path}")
    model = adaface_net.build_model(ADAFACE_ARCHITECTURE)
    statedict = torch.load(ckpt_path, map_location="cpu", weights_only=False)["state_dict"]
    model_statedict = {key[6:]: val for key, val in statedict.items() if key.startswith("model.")}
    model.load_state_dict(model_statedict)
    model.eval()
    if torch.cuda.is_available():
        model = model.cuda()
    _adaface_model = model
    logger.info("AdaFace model loaded successfully")


def warmup(images: list):
    logger.info("Warming up face recognition ...")
    image_bytes = utils_module.to_image_bytes(images[0])
    embedding = _executor.submit(get_face_embedding, image_bytes).result()
    logger.debug(f"Face recognition warmup embedding: {embedding is not None}")
    logger.info(f"Face recognition warmup complete — {FACE_CHECK_WORKERS} workers ready")


def _ensure_loaded():
    if _face_app is None or _adaface_model is None:
        raise RuntimeError(
            "Face recognition not initialized. Call face_recognition.get_app() "
            "before running similarity checks."
        )


# ---------------------------------------------------------------------------
# Detection + alignment
# ---------------------------------------------------------------------------

def _detect_and_align(img: np.ndarray) -> np.ndarray | None:
    """Detect largest face with SCRFD and return a 112×112 BGR aligned crop, or None."""
    faces = _face_app.get(img)

    if not faces:
        pad = 200
        padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(128, 128, 128))
        faces = _face_app.get(padded)
        if not faces:
            return None
        img = padded

    best_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

    if best_face.kps is None:
        logger.warning("Face detected but keypoints unavailable — cannot align")
        return None

    return face_align.norm_crop(img, landmark=best_face.kps, image_size=112)


# ---------------------------------------------------------------------------
# AdaFace embedding
# ---------------------------------------------------------------------------

def _adaface_embedding(aligned_bgr: np.ndarray) -> np.ndarray:
    """Run AdaFace on a 112×112 BGR aligned face and return L2-normalized embedding."""
    # AdaFace model was trained with BGR input: ((bgr/255) - 0.5) / 0.5
    bgr = aligned_bgr.astype(np.float32)
    normalized = ((bgr / 255.0) - 0.5) / 0.5
    tensor = torch.tensor(normalized.transpose(2, 0, 1)[np.newaxis]).float()
    if torch.cuda.is_available():
        tensor = tensor.cuda()

    with torch.no_grad():
        embedding, _ = _adaface_model(tensor)  # (1, 512), already L2-normalized

    return embedding[0].cpu().numpy()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_face_embedding(image_bytes: bytes) -> np.ndarray | None:
    _ensure_loaded()

    img = bytes_to_cv2(image_bytes)
    img = enhance_image(img)
    aligned = _detect_and_align(img)

    if aligned is None:
        return None

    return _adaface_embedding(aligned)


def _evict_embedding_cache(now: float) -> None:
    expired_keys = [k for k, (_, expiry) in _id_embedding_cache.items() if now > expiry]
    for k in expired_keys:
        del _id_embedding_cache[k]
    if expired_keys:
        logger.debug(f"Evicted {len(expired_keys)} expired embedding cache entries ({len(_id_embedding_cache)} remaining)")

    while len(_id_embedding_cache) >= EMBEDDING_CACHE_MAX_SIZE:
        _id_embedding_cache.popitem(last=False)
        logger.debug(f"Embedding cache full ({EMBEDDING_CACHE_MAX_SIZE}) — evicted oldest LRU entry")


def get_face_embedding_cached(image_bytes: bytes) -> np.ndarray | None:
    key = hash(image_bytes)
    now = time.monotonic()

    cached = _id_embedding_cache.get(key)

    if cached is not None and now <= cached[1]:
        _id_embedding_cache.move_to_end(key)
        return cached[0]

    _evict_embedding_cache(now)

    logger.debug("Cache miss for embedding — computing face embedding")
    embedding = get_face_embedding(image_bytes)

    _id_embedding_cache[key] = (embedding, now + EMBEDDING_CACHE_TTL)

    return embedding


def calc_face_similarity(
    id_images_bytes: List[bytes],
    test_image_bytes: bytes,
) -> float | None:
    emb_test = get_face_embedding(test_image_bytes)

    if emb_test is None:
        return None

    max_similarity = 0.0
    found_any = False

    for index, id_image_bytes in enumerate(id_images_bytes):
        emb_id = get_face_embedding_cached(id_image_bytes)

        if emb_id is None:
            logger.warning("No face detected in one of the ID images, skipping")
            continue

        found_any = True
        distance = cosine(emb_id, emb_test)
        curr_similarity = 1.0 - distance
        logger.debug(f"Face match {index}: {curr_similarity}")
        max_similarity = max(max_similarity, curr_similarity)

    return max_similarity if found_any else None


def _check_single(img, id_images_bytes: List[bytes]) -> float:
    image_bytes = utils_module.to_image_bytes(img)
    similarity = calc_face_similarity(id_images_bytes, image_bytes)
    if similarity is None:
        logger.info("Face not found to check similarity")
        return 0.0
    return float(similarity)


def run_face_match_check(imgs: list, id_photos) -> List[float]:
    if not id_photos:
        logger.info("ID photos not provided for similarity check")
        return [0.0] * len(imgs)

    id_images_bytes = [utils_module.to_image_bytes(id_photo) for id_photo in id_photos]

    futures = [_executor.submit(_check_single, img, id_images_bytes) for img in imgs]
    return [f.result() for f in futures]
