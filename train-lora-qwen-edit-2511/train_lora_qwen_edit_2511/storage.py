import io
import os
import shutil
import threading
import uuid
from pathlib import Path

from filelock import FileLock
from google.cloud import storage
from PIL import Image

from train_lora_qwen_edit_2511.logger import logger

BUCKET_NAME = os.environ.get("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = Path(os.environ.get("QWEN_MODEL_PATH", "/workspace/models/qwen-edit-2511")).parent
MEDIA_CACHE_DIR = Path(os.environ.get("MEDIA_CACHE_DIR", "/workspace/media_cache"))
MEDIA_CACHE_TTL = int(os.environ.get("MEDIA_CACHE_TTL_SECONDS", "3600"))
LORA_OUTPUT_DIR = Path(os.environ.get("LORA_OUTPUT_DIR", "/workspace/lora_output"))

MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
LORA_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_gcs_client: storage.Client | None = None
_gcs_lock = threading.Lock()


def _get_gcs() -> storage.Client:
    global _gcs_client
    with _gcs_lock:
        if _gcs_client is None:
            _gcs_client = storage.Client()
    return _gcs_client


def _is_fresh(path: Path) -> bool:
    if not path.exists():
        return False
    age = path.stat().st_mtime
    import time
    return (time.time() - age) < MEDIA_CACHE_TTL


def download_images(media_paths: list[str]) -> list[Image.Image | None]:
    """
    Download images from GCS preserving index alignment with media_paths.
    Returns None at each index where the download or open failed.
    """
    bucket = _get_gcs().bucket(BUCKET_NAME)
    images: list[Image.Image | None] = []

    for blob_path in media_paths:
        safe_name = blob_path.replace("/", "__")
        cache_path = MEDIA_CACHE_DIR / safe_name
        lock_path = cache_path.with_suffix(".lock")

        with FileLock(str(lock_path), timeout=45):
            if not _is_fresh(cache_path):
                blob = bucket.blob(blob_path)
                if not blob.exists():
                    logger.warning(f"Blob not found, skipping: {blob_path}")
                    images.append(None)
                    continue
                tmp = cache_path.with_suffix(f".{uuid.uuid4().hex}.tmp")
                try:
                    blob.download_to_filename(str(tmp))
                    tmp.rename(cache_path)
                    logger.info(f"Downloaded {blob_path}")
                except Exception as e:
                    tmp.unlink(missing_ok=True)
                    logger.error(f"Failed to download {blob_path}: {e}")
                    images.append(None)
                    continue

        try:
            img = Image.open(cache_path).convert("RGB")
            images.append(img)
        except Exception as e:
            logger.error(f"Failed to open cached image {cache_path}: {e}")
            cache_path.unlink(missing_ok=True)
            images.append(None)

    return images


def download_model(model_name: str):
    """Sync model folder from GCS to local disk, skipping files that already match by size."""
    remote_prefix = f"{BUCKET_MODELS_PATH}/{model_name}/"
    logger.info(f"Syncing {model_name} from bucket: {BUCKET_NAME}")

    bucket = _get_gcs().bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=remote_prefix))

    if not blobs:
        raise RuntimeError(f"No blobs found at gs://{BUCKET_NAME}/{remote_prefix}")

    for blob in blobs:
        if blob.name.endswith("/"):
            continue
        relative = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        local_path = LOCAL_MODELS_PATH / relative

        if local_path.exists() and local_path.stat().st_size == blob.size:
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    logger.info(f"Sync for {model_name} complete")


def upload_lora(local_dir: Path, dest: str):
    """Upload the single .safetensors file from local_dir to dest in GCS."""
    safetensors_files = list(local_dir.rglob("*.safetensors"))
    if not safetensors_files:
        raise RuntimeError(f"No .safetensors file found in {local_dir}")
    local_file = safetensors_files[0]
    _get_gcs().bucket(BUCKET_NAME).blob(dest).upload_from_filename(str(local_file))
    logger.info(f"Uploaded {local_file.name} → gs://{BUCKET_NAME}/{dest}")


def make_lora_output_dir(job_id: str) -> Path:
    out = LORA_OUTPUT_DIR / job_id
    out.mkdir(parents=True, exist_ok=True)
    return out


def cleanup_lora_output_dir(job_id: str):
    out = LORA_OUTPUT_DIR / job_id
    shutil.rmtree(out, ignore_errors=True)
