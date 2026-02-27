import io
import os
import time
import random
from typing import List
import numpy as np
from deepface import DeepFace
from scipy.spatial.distance import cosine
import gen_text_image_to_image_service.utils as utils_module
import gen_text_image_to_image_service.logger as log_module

DEFAULT_CONFIG = {
    "detector_backend": "retinaface",
    "model_name": "ArcFace",
    "distance_metric": "cosine",
    "align": True,
    "normalization": "base",
    "enforce_detection": False,
}

logger = log_module.get_logger(__name__)


def get_face_embedding(
    image_bytes: bytes,
    config: dict = None
) -> np.ndarray | None:
    if config is None:
        config = DEFAULT_CONFIG.copy()

    img_file = io.BytesIO(image_bytes)

    representations = DeepFace.represent(
        img_path=img_file,
        model_name=config["model_name"],
        detector_backend=config["detector_backend"],
        align=config["align"],
        normalization=config["normalization"],
        enforce_detection=config["enforce_detection"]
    )

    if not representations:
        return None

    if len(representations) > 1:
        areas = [
            r["facial_area"]["w"] * r["facial_area"]["h"]
            for r in representations
        ]
        best_idx = np.argmax(areas)
        return representations[best_idx]["embedding"]

    return representations[0]["embedding"]

def calc_face_similarity(
    id_images_bytes: List[bytes],
    test_image_bytes: bytes,
    config: dict = None
) -> float | None:
    if config is None:
        config = DEFAULT_CONFIG.copy()

    emb_test = get_face_embedding(test_image_bytes, config)
    max_similarity = 0

    if not emb_test:
        return None

    for id_image_bytes in id_images_bytes:
        emb_id = get_face_embedding(id_image_bytes, config)
    
        distance = cosine(emb_id, emb_test)
        curr_similarity = 1.0 - distance

        max_similarity = max(max_similarity, curr_similarity)

    return max_similarity

def run_similarity_check(img, id_photos):
    if len(id_photos) == 0:
        logger.info(f"ID photos not provided for similarity check")
        return None
    
    image_bytes = utils_module.to_image_bytes(img)
    id_images_bytes = [utils_module.to_image_bytes(id_photo) for id_photo in id_photos]

    similarity = calc_face_similarity(id_images_bytes, image_bytes)

    if similarity == None:
        logger.info(f"Face not found to check similarity")
        return None

    return similarity
