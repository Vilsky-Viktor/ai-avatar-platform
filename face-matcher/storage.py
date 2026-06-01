import logging
import os

from google.cloud import storage

BUCKET_NAME = os.environ["BUCKET_NAME"]

_client: storage.Client | None = None
logger = logging.getLogger(__name__)

# Bucket paths for model files that are downloaded once on startup
_MODEL_FILES = [
    "models/adaface/adaface_ir101_webface12m.ckpt",
    "models/adaface/adaface_ir101.onnx",
    "models/adaface/adaface_ir101.onnx.data",
]


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = storage.Client()
    return _client


def download_bytes(blob_path: str) -> bytes:
    logger.info(f"Downloading {blob_path}")
    bucket = _get_client().bucket(BUCKET_NAME)
    data = bucket.blob(blob_path).download_as_bytes()
    logger.info(f"Downloaded {len(data)} bytes from {blob_path}")
    return data


def download_models(local_dir: str) -> None:
    """Download model files from the bucket into local_dir, skipping files already present."""
    os.makedirs(local_dir, exist_ok=True)
    bucket = _get_client().bucket(BUCKET_NAME)

    for blob_path in _MODEL_FILES:
        filename   = os.path.basename(blob_path)
        local_path = os.path.join(local_dir, filename)

        if os.path.exists(local_path):
            logger.info(f"Model file already present, skipping: {local_path}")
            continue

        logger.info(f"Downloading model {blob_path} → {local_path}")
        bucket.blob(blob_path).download_to_filename(local_path)
        logger.info(f"Saved {os.path.getsize(local_path):,} bytes to {local_path}")
