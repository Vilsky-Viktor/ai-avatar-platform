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
import gen_text_image_to_image_service.ai_model as model_module


MIN_ALLOWED_SIMILARITY = float(os.getenv("MIN_ALLOWED_SIMILARITE", 0.7))
MAX_QUALITY_RETRIES = int(os.getenv("MAX_QUALITY_RETRIES", 4))
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

def run_similarity_check(model_params, prompt, img, id_photos, reference_images):
    num_tries = 1
    max_similarity = 0
    min_similarity = 0

    if len(id_photos) == 0:
        logger.info(f"ID photos not provided for similarity check")
        return img, max_similarity, min_similarity, num_tries
    
    image_bytes = utils_module.to_image_bytes(img)
    id_images_bytes = [utils_module.to_image_bytes(id_photo) for id_photo in id_photos]

    best_img = img
    max_similarity = calc_face_similarity(id_images_bytes, image_bytes)
    min_similarity = max_similarity

    # face not found
    if max_similarity == None:
        logger.info(f"Face not found to check similarity")
        return img, -1, -1, num_tries

    if max_similarity >= MIN_ALLOWED_SIMILARITY:
        logger.info(f"First generation good enough ({max_similarity:.3f} ≥ {MIN_ALLOWED_SIMILARITY})")
        return best_img, max_similarity, min_similarity, num_tries

    for attempt in range(1, MAX_QUALITY_RETRIES + 1):
        logger.info(f"Similarity {max_similarity:.3f} < {MIN_ALLOWED_SIMILARITY} → retry {attempt}/{MAX_QUALITY_RETRIES}")
        num_tries += 1

        model_params["seed"] = random.randrange(2**31)

        candidate_image = model_module.run_inference(model_params, reference_images, prompt)
        candidate_image_bytes = utils_module.to_image_bytes(candidate_image)
        current_sim = calc_face_similarity(id_images_bytes, candidate_image_bytes)

        min_similarity = min(current_sim, min_similarity)

        if current_sim > max_similarity:
            best_img = candidate_image
            max_similarity = current_sim

        if current_sim >= MIN_ALLOWED_SIMILARITY:
            logger.info(f"Retry {attempt} succeeded ({current_sim:.3f} ≥ {MIN_ALLOWED_SIMILARITY})")
            break

    if max_similarity >= MIN_ALLOWED_SIMILARITY:
        logger.info(f"Final similarity achieved: {max_similarity:.3f}")
    else:
        logger.warning(f"Max retries reached. Best similarity: {max_similarity:.3f} (below {MIN_ALLOWED_SIMILARITY})")

    return best_img, max_similarity, min_similarity, num_tries
