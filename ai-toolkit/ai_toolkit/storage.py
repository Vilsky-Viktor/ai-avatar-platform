import io
import os
import shutil
import threading
import uuid
from pathlib import Path

from filelock import FileLock
from google.cloud import storage
from PIL import Image

from ai_toolkit.logger import logger

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
        local_path = LOCAL_MODELS_BASE / relative

        if local_path.exists() and local_path.stat().st_size == blob.size:
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    logger.info(f"Sync for {model_name} complete")


def sync_models():
    """
    True sync of models/ folder from GCS to local disk:
    - Downloads files that are missing or have a different size.
    - Removes local files that no longer exist in the bucket.
    """
    logger.info(f"Syncing models folder from bucket: {BUCKET_NAME}")

    bucket = _get_gcs().bucket(BUCKET_NAME)
    blobs = [b for b in bucket.list_blobs(prefix=f"{BUCKET_MODELS_PATH}/") if not b.name.endswith("/")]

    if not blobs:
        raise RuntimeError(f"No blobs found at gs://{BUCKET_NAME}/{BUCKET_MODELS_PATH}/")

    # Build set of expected local paths
    expected: set[Path] = set()
    for blob in blobs:
        relative = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        local_path = LOCAL_MODELS_BASE / relative
        expected.add(local_path)

        if local_path.exists() and local_path.stat().st_size == blob.size:
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(local_path))
        logger.info(f"Downloaded {blob.name}")

    # Remove local files no longer in the bucket
    if LOCAL_MODELS_BASE.exists():
        for local_file in LOCAL_MODELS_BASE.rglob("*"):
            if local_file.is_file() and local_file not in expected:
                local_file.unlink()
                logger.info(f"Removed {local_file}")

    logger.info("Models folder sync complete")


def write_dataset(images: list[Image.Image], prompts: list[str], dataset_dir: Path, resolution: int = 1024) -> Path:
    """
    Write images + caption .txt files to dataset_dir and black resolution×resolution control images
    to a control/ subfolder (required for Qwen Image Edit 2511 in AI toolkit).
    Returns (images_dir, control_dir).
    """
    images_dir = dataset_dir / "images"
    control_dir = dataset_dir / "control"
    images_dir.mkdir(parents=True, exist_ok=True)
    control_dir.mkdir(parents=True, exist_ok=True)

    sample = images[0] if images else None
    if sample and sample.size != (resolution, resolution):
        logger.info(f"Resizing {len(images)} images from {sample.size[0]}x{sample.size[1]} to {resolution}x{resolution}")

    black = Image.new("RGB", (resolution, resolution), (0, 0, 0))
    for i, (img, prompt) in enumerate(zip(images, prompts)):
        stem = f"{i:04d}"
        img.resize((resolution, resolution), Image.LANCZOS).save(str(images_dir / f"{stem}.png"))
        (images_dir / f"{stem}.txt").write_text(prompt, encoding="utf-8")
        black.save(str(control_dir / f"{stem}.png"))

    logger.info(f"Wrote {len(images)} images, captions, and control images to {dataset_dir}")
    return images_dir, control_dir


def upload_lora_checkpoints(local_dir: Path, dest_prefix: str) -> int:
    """Upload lora.safetensors and config.yaml from local_dir to GCS.

    Returns the number of files uploaded.
    """
    target_names = {"lora.safetensors", "config.yaml"}
    files = [f for f in local_dir.rglob("*") if f.is_file() and f.name in target_names]
    if not files:
        raise RuntimeError(f"No result files found in {local_dir}")

    bucket = _get_gcs().bucket(BUCKET_NAME)
    for f in files:
        blob_path = f"{dest_prefix}/{f.name}"
        bucket.blob(blob_path).upload_from_filename(str(f))
        logger.info(f"Uploaded {f.name} → gs://{BUCKET_NAME}/{blob_path}")

    return len(files)


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
