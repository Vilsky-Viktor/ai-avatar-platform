import os
import glob
import shutil
import time
import cv2
import numpy as np
from collections import OrderedDict
from typing import List
from insightface.app import FaceAnalysis
from scipy.spatial.distance import cosine
import gen_ti2i_controlnet.utils as utils_module
import gen_ti2i_controlnet.logger as log_module

INSIGHTFACE_MODEL        = os.getenv("INSIGHTFACE_MODEL", "buffalo_l")
INSIGHTFACE_DET_SIZE     = (640, 640)
EMBEDDING_CACHE_TTL      = int(os.getenv("EMBEDDING_CACHE_TTL", "3600"))
EMBEDDING_CACHE_MAX_SIZE = int(os.getenv("EMBEDDING_CACHE_MAX_SIZE", "500"))

logger = log_module.get_logger(__name__)
_face_app = None
_id_embedding_cache: OrderedDict[int, tuple[np.ndarray | None, float]] = OrderedDict()


def get_app():
    global _face_app

    # InsightFace stores models at {root}/models/{name}/.
    # If a previous run created the directory but failed mid-download,
    # ensure_available() thinks models exist and skips re-download.
    # Clear the empty directory so InsightFace re-downloads cleanly.
    model_dir = f"/workspace/models/models/{INSIGHTFACE_MODEL}"
    if os.path.isdir(model_dir) and not glob.glob(os.path.join(model_dir, "*.onnx")):
        logger.warning(f"InsightFace model dir exists but has no .onnx files — clearing for re-download: {model_dir}")
        shutil.rmtree(model_dir)

    logger.info(f"Loading InsightFace model: {INSIGHTFACE_MODEL}")
    trt_cache_path = "/workspace/models/trt_cache"
    os.makedirs(trt_cache_path, exist_ok=True)

    _face_app = FaceAnalysis(
        name=INSIGHTFACE_MODEL,
        root="/workspace/models",
        providers=[
            ("TensorrtExecutionProvider", {
                "trt_engine_cache_enable": "True",
                "trt_engine_cache_path": trt_cache_path,
                "trt_fp16_enable": "True",
            }),
            "CUDAExecutionProvider",
            "CPUExecutionProvider",
        ]
    )
    _face_app.prepare(ctx_id=0, det_size=INSIGHTFACE_DET_SIZE)
    logger.info("InsightFace model loaded successfully")


def warmup(images: list):
    logger.info("Warming up InsightFace ...")
    for img in images:
        image_bytes = utils_module.to_image_bytes(img)
        embedding = get_face_embedding(image_bytes)
        logger.debug(f"InsightFace warmup embedding: {embedding is not None}")
    logger.info("InsightFace warmup complete")


def _ensure_loaded():
    if _face_app is None:
        raise RuntimeError(
            "InsightFace not initialized. Call similarity_module.get_face_app() "
            "before running similarity checks."
        )


def _bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes")
    return img


def _enhance_image(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge((l, a, b))
    img = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    mean_brightness = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    if mean_brightness < 80:
        gamma = 1.5
        table = np.array([(i / 255.0) ** (1.0 / gamma) * 255 for i in range(256)]).astype("uint8")
        img = cv2.LUT(img, table)

    return img


def get_face_embedding(image_bytes: bytes) -> np.ndarray | None:
    _ensure_loaded()

    img = _bytes_to_cv2(image_bytes)
    img = _enhance_image(img)
    faces = _face_app.get(img)

    if not faces:
        pad = 200
        padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(128, 128, 128))
        faces = _face_app.get(padded)

    if not faces:
        return None

    if len(faces) > 1:
        best_face = max(faces, key=lambda f: (
            (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
        ))
        return best_face.embedding

    return faces[0].embedding


def _evict_embedding_cache(now: float) -> None:
    """Must be called with lock already held"""
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

    logger.debug(f"Cache miss for embedding — get face embedding")
    embedding = get_face_embedding(image_bytes)

    _id_embedding_cache[key] = (embedding, now + EMBEDDING_CACHE_TTL)

    return embedding


def calc_face_similarity(
    id_images_bytes: List[bytes],
    test_image_bytes: bytes,
) -> float | None:
    emb_test = get_face_embedding(test_image_bytes)   # usually called once → no cache

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


def run_face_match_check(img, id_photos) -> float | None:
    if not id_photos:
        logger.info("ID photos not provided for similarity check")
        return 0

    image_bytes = utils_module.to_image_bytes(img)
    id_images_bytes = [utils_module.to_image_bytes(id_photo) for id_photo in id_photos]

    similarity = calc_face_similarity(id_images_bytes, image_bytes)

    if similarity is None:
        logger.info("Face not found to check similarity")
        return 0

    return float(similarity)