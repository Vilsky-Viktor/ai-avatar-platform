import io
import json
import os
import shutil
import threading
import uuid
from pathlib import Path

from filelock import FileLock
from google.cloud import storage
from PIL import Image

from train_videox_fun.logger import logger

BUCKET_NAME = os.environ.get("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_BASE = Path(os.environ.get("LOCAL_MODELS_BASE", "/workspace/models"))
MEDIA_CACHE_DIR = Path(os.environ.get("MEDIA_CACHE_DIR", "/workspace/media_cache"))
MEDIA_CACHE_TTL = int(os.environ.get("MEDIA_CACHE_TTL_SECONDS", "3600"))
LORA_OUTPUT_DIR = Path(os.environ.get("LORA_OUTPUT_DIR", "/workspace/lora_output"))
DATASET_BASE_DIR = Path(os.environ.get("DATASET_BASE_DIR", "/workspace/datasets"))

MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
LORA_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DATASET_BASE_DIR.mkdir(parents=True, exist_ok=True)

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
    import time
    return (time.time() - path.stat().st_mtime) < MEDIA_CACHE_TTL


def download_images(media_paths: list[str]) -> list[Image.Image | None]:
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
        local_path = LOCAL_MODELS_BASE / relative

        if local_path.exists() and local_path.stat().st_size == blob.size:
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    logger.info(f"Sync for {model_name} complete")


def write_dataset(
    images: list[Image.Image],
    prompts: list[str],
    dataset_dir: Path,
    resolution: int = 1024,
) -> tuple[Path, Path]:
    """Write images + captions and return (images_dir, meta_path)."""
    images_dir = dataset_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    sample = images[0] if images else None
    if sample and sample.size != (resolution, resolution):
        logger.info(
            f"Resizing {len(images)} images from {sample.size[0]}x{sample.size[1]} "
            f"to {resolution}x{resolution}"
        )

    metadata = []
    for i, (img, prompt) in enumerate(zip(images, prompts)):
        stem = f"{i:04d}"
        img_path = images_dir / f"{stem}.png"
        img.resize((resolution, resolution), Image.LANCZOS).save(str(img_path))
        metadata.append({"file_path": str(img_path), "text": prompt, "type": "image"})

    meta_path = dataset_dir / "metadata.json"
    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    logger.info(f"Wrote {len(images)} images and metadata to {dataset_dir}")
    return images_dir, meta_path


def upload_lora(local_path: Path, dest_blob_path: str):
    bucket = _get_gcs().bucket(BUCKET_NAME)
    bucket.blob(dest_blob_path).upload_from_filename(str(local_path))
    logger.info(f"Uploaded {local_path.name} → gs://{BUCKET_NAME}/{dest_blob_path}")


def make_lora_output_dir(job_id: str) -> Path:
    out = LORA_OUTPUT_DIR / job_id
    out.mkdir(parents=True, exist_ok=True)
    return out


def make_dataset_dir(job_id: str) -> Path:
    d = DATASET_BASE_DIR / job_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def cleanup_lora_output_dir(job_id: str):
    shutil.rmtree(LORA_OUTPUT_DIR / job_id, ignore_errors=True)


def cleanup_dataset_dir(job_id: str):
    shutil.rmtree(DATASET_BASE_DIR / job_id, ignore_errors=True)
