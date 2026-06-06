import glob
import hashlib
import io
import logging
import os
import queue
import shutil
import time
from collections import OrderedDict
from contextlib import contextmanager
from typing import List

import cv2
import numpy as np
import torch
from insightface.app import FaceAnalysis
from insightface.utils import face_align
from scipy.spatial.distance import cosine

from adaface import net as adaface_net

INSIGHTFACE_MODEL    = os.getenv("INSIGHTFACE_MODEL", "buffalo_l")
INSIGHTFACE_ROOT     = os.getenv("INSIGHTFACE_ROOT", "/models/insightface")
INSIGHTFACE_DET_SIZE = (640, 640)
ADAFACE_MODEL_DIR    = os.getenv("ADAFACE_MODEL_DIR", "/app/models/adaface")
ADAFACE_ARCHITECTURE = os.getenv("ADAFACE_ARCHITECTURE", "ir_101")

EMBEDDING_CACHE_TTL      = int(os.getenv("EMBEDDING_CACHE_TTL", "3600"))
EMBEDDING_CACHE_MAX_SIZE = int(os.getenv("EMBEDDING_CACHE_MAX_SIZE", "500"))

logger = logging.getLogger(__name__)

_pool: queue.Queue["_FaceRecognitionInstance"] = queue.Queue()


class _FaceRecognitionInstance:
    def __init__(self, idx: int):
        self.idx = idx
        self._face_app: FaceAnalysis | None = None
        self._adaface_model: adaface_net.Backbone | None = None
        self._embedding_cache: OrderedDict[int, tuple[np.ndarray | None, float]] = OrderedDict()

    def load(self):
        model_dir    = os.path.join(INSIGHTFACE_ROOT, "models", INSIGHTFACE_MODEL)
        det_prefixes = ["det_", "scrfd_", "retinaface_"]
        has_onnx     = bool(glob.glob(os.path.join(model_dir, "*.onnx")))
        has_det      = any(glob.glob(os.path.join(model_dir, f"{p}*.onnx")) for p in det_prefixes)
        if os.path.isdir(model_dir) and (not has_onnx or not has_det):
            logger.warning(f"[instance {self.idx}] InsightFace model dir incomplete — clearing for re-download: {model_dir}")
            shutil.rmtree(model_dir)

        logger.info(f"[instance {self.idx}] Loading SCRFD detector ({INSIGHTFACE_MODEL})")
        self._face_app = FaceAnalysis(
            name=INSIGHTFACE_MODEL,
            root=INSIGHTFACE_ROOT,
            allowed_modules=["detection"],
            providers=["CPUExecutionProvider"],
        )
        self._face_app.prepare(ctx_id=-1, det_size=INSIGHTFACE_DET_SIZE)
        logger.info(f"[instance {self.idx}] SCRFD detector loaded")

        ckpt_path = _find_checkpoint()
        logger.info(f"[instance {self.idx}] Loading AdaFace {ADAFACE_ARCHITECTURE} from {ckpt_path}")
        model      = adaface_net.build_model(ADAFACE_ARCHITECTURE)
        statedict  = torch.load(ckpt_path, map_location="cpu", weights_only=False)["state_dict"]
        model_statedict = {key[6:]: val for key, val in statedict.items() if key.startswith("model.")}
        model.load_state_dict(model_statedict)
        model.eval()
        self._adaface_model = model
        logger.info(f"[instance {self.idx}] AdaFace model loaded successfully")

    def _ensure_loaded(self):
        if self._face_app is None or self._adaface_model is None:
            raise RuntimeError("Face recognition not initialized. Call get_app() before processing jobs.")

    def _detect_and_align(self, img: np.ndarray) -> np.ndarray | None:
        faces = self._face_app.get(img)

        if not faces:
            pad    = 200
            padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(128, 128, 128))
            faces  = self._face_app.get(padded)
            if not faces:
                return None
            img = padded

        best_face = max(faces, key=lambda f: f.det_score * (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        if best_face.det_score < 0.3:
            logger.warning(f"[instance {self.idx}] Best face detection score too low ({best_face.det_score:.2f}) — skipping")
            return None

        if best_face.kps is None:
            logger.warning(f"[instance {self.idx}] Face detected but keypoints unavailable — cannot align")
            return None

        x1, y1, x2, y2 = [int(v) for v in best_face.bbox]
        face_size = max(x2 - x1, y2 - y1)
        if face_size < 256:
            scale    = 256 / face_size
            new_h, new_w = int(img.shape[0] * scale), int(img.shape[1] * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            kps = best_face.kps * scale
        else:
            kps = best_face.kps

        return face_align.norm_crop(img, landmark=kps, image_size=112)

    def _adaface_embedding(self, aligned_bgr: np.ndarray) -> np.ndarray:
        bgr        = aligned_bgr.astype(np.float32)
        normalized = ((bgr / 255.0) - 0.5) / 0.5
        tensor     = torch.tensor(normalized.transpose(2, 0, 1)[np.newaxis]).float()

        with torch.no_grad():
            embedding, _ = self._adaface_model(tensor)

        return embedding[0].cpu().numpy()

    def get_face_embedding(self, image_bytes: bytes) -> np.ndarray | None:
        self._ensure_loaded()
        img     = _bytes_to_cv2(image_bytes)
        aligned = self._detect_and_align(img)
        if aligned is None:
            return None
        aligned = _enhance_image(aligned)
        return self._adaface_embedding(aligned)

    def _evict_embedding_cache(self, now: float) -> None:
        expired = [k for k, (_, expiry) in self._embedding_cache.items() if now > expiry]
        for k in expired:
            del self._embedding_cache[k]
        while len(self._embedding_cache) >= EMBEDDING_CACHE_MAX_SIZE:
            self._embedding_cache.popitem(last=False)

    def get_face_embedding_cached(self, image_bytes: bytes) -> np.ndarray | None:
        key = hashlib.sha256(image_bytes).digest()
        now = time.monotonic()

        cached = self._embedding_cache.get(key)
        if cached is not None and now <= cached[1]:
            self._embedding_cache.move_to_end(key)
            return cached[0]

        self._evict_embedding_cache(now)
        embedding = self.get_face_embedding(image_bytes)
        self._embedding_cache[key] = (embedding, now + EMBEDDING_CACHE_TTL)
        return embedding

    def calc_face_similarity(self, id_images_bytes: List[bytes], test_image_bytes: bytes) -> float | None:
        t0        = time.monotonic()
        emb_test  = self.get_face_embedding(test_image_bytes)

        if emb_test is None:
            return None

        max_similarity = 0.0
        found_any      = False

        for idx, id_bytes in enumerate(id_images_bytes):
            emb_id = self.get_face_embedding_cached(id_bytes)
            if emb_id is None:
                logger.warning(f"[instance {self.idx}] No face in ID image {idx} — skipping")
                continue
            found_any       = True
            similarity      = 1.0 - cosine(emb_id, emb_test)
            logger.debug(f"[instance {self.idx}] ID image {idx} similarity: {similarity:.4f}")
            max_similarity  = max(max_similarity, similarity)

        elapsed = time.monotonic() - t0
        logger.info(f"[instance {self.idx}] calc_face_similarity finished in {elapsed:.2f}s, best={max_similarity:.4f}")
        return max_similarity if found_any else None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image bytes")
    return img


def _enhance_image(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = cv2.merge([clahe.apply(l), a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def _find_checkpoint() -> str:
    matches = sorted(glob.glob(os.path.join(ADAFACE_MODEL_DIR, "*.ckpt")))
    if not matches:
        raise FileNotFoundError(f"No AdaFace checkpoint (*.ckpt) found in {ADAFACE_MODEL_DIR}")
    return matches[0]


# ---------------------------------------------------------------------------
# Pool API
# ---------------------------------------------------------------------------

def get_app(n: int = 1):
    for i in range(n):
        inst = _FaceRecognitionInstance(i)
        inst.load()
        _pool.put(inst)


@contextmanager
def acquire_face_recognition():
    inst = _pool.get()
    try:
        yield inst
    finally:
        _pool.put(inst)
