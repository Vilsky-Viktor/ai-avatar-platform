import os
import io
import time
from pathlib import Path
from uuid import uuid4
from google.cloud import storage
from PIL import Image, ExifTags
from filelock import FileLock, Timeout
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"

# Local image cache settings
LOCAL_IMAGE_CACHE_DIR = Path("/workspace/images")
IMAGE_CACHE_TTL_SECONDS = int(os.getenv("IMAGE_CACHE_TTL_SECONDS", "3600"))

# Ensure cache directory exists
LOCAL_IMAGE_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _get_local_image_path(blob_path: str) -> Path:
    """Map GCS blob path → local cache path (preserving folder structure)"""
    # blob_path e.g. "users/abc123/inputs/photo.jpg"
    # → /workspace/images/users/abc123/inputs/photo.jpg
    return LOCAL_IMAGE_CACHE_DIR / blob_path.lstrip("/")


def _is_file_fresh_enough(path: Path) -> bool:
    """Check if file exists and is younger than TTL"""
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < IMAGE_CACHE_TTL_SECONDS


def _evict_expired_images() -> None:
    """Opportunistic cleanup — remove files older than TTL"""
    now = time.time()
    removed = 0

    for file_path in LOCAL_IMAGE_CACHE_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        # Skip lock files — they are tied to open fds and safe to leave
        if file_path.suffix == ".lock" or file_path.stem.endswith("-tmp"):
            continue
        age = now - file_path.stat().st_mtime
        if age >= IMAGE_CACHE_TTL_SECONDS:
            try:
                file_path.unlink()
                removed += 1
            except Exception as e:
                logger.warning(f"Failed to evict expired file {file_path}: {e}")

    if removed > 0:
        logger.debug(f"Evicted {removed} expired images from local cache")


def _load_image_from_disk(local_path: Path, label: str) -> Image.Image | None:
    """
    Open and return a PIL image from disk.
    Returns None on any read failure (corrupted file, evicted between check and open, etc.).
    Callers should delete the file and fall through to re-download on None.
    """
    try:
        return Image.open(local_path).convert("RGB")
    except FileNotFoundError:
        # File was evicted by another pod between the freshness check and open — normal at TTL boundary
        logger.debug(f"Cache file disappeared before open (evicted mid-read?): {label}")
        return None
    except Exception as e:
        logger.warning(f"Corrupted cache file {local_path}: {e} — will re-download")
        local_path.unlink(missing_ok=True)
        return None


def download_models(model_name):
    remote_prefix = f"{BUCKET_MODELS_PATH}/{model_name}/"
    local_base_dir = Path(LOCAL_MODELS_PATH)
    logger.info(f"Syncing {model_name} from bucket: {BUCKET_NAME}")

    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=remote_prefix))

    if not blobs:
        logger.error(f"No blobs found for {remote_prefix}")
        return

    for blob in blobs:
        if blob.name.endswith('/'):
            continue
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists() and final_dest.stat().st_size == blob.size:
            continue

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(final_dest))
    logger.info(f"Sync for {model_name} complete")


def load_input_images(image_paths: list[str], safety_checker=None) -> list[Image.Image]:
    _evict_expired_images()

    bucket = storage_client.bucket(BUCKET_NAME)
    valid_images = []

    for blob_path in image_paths:
        local_path = _get_local_image_path(blob_path)
        lock_path = local_path.with_suffix(local_path.suffix + ".lock")

        # ── Fast path: file looks fresh, try to load without acquiring the lock ──
        if _is_file_fresh_enough(local_path):
            img = _load_image_from_disk(local_path, blob_path)
            if img is not None:
                # if safety_checker and safety_checker.test_image(str(local_path)):
                #     logger.info(f"Safety blocked cached image: {blob_path}")
                #     continue
                valid_images.append(img)
                logger.debug(f"Loaded from cache: {blob_path}")
                continue
            # img is None → file was corrupted or evicted; fall through to locked download

        # ── Slow path: acquire lock, re-check, then download ──
        lock = FileLock(str(lock_path), timeout=45)

        try:
            with lock.acquire(timeout=45):
                # Re-check under lock — another pod may have downloaded while we waited
                if _is_file_fresh_enough(local_path):
                    img = _load_image_from_disk(local_path, blob_path)
                    if img is not None:
                        valid_images.append(img)
                        logger.debug(f"Another pod already cached {blob_path}")
                        continue
                    # File appeared but is broken — delete and re-download below
                    local_path.unlink(missing_ok=True)

                blob = bucket.blob(blob_path)
                if not blob.exists():
                    logger.debug(f"Blob not found in GCS: {blob_path}")
                    continue

                try:
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    tmp_path = local_path.with_name(f"{local_path.name}.{uuid4().hex[:10]}.tmp")

                    logger.debug(f"Downloading {blob_path} → {tmp_path}")
                    blob.download_to_filename(str(tmp_path))

                    size_mb = tmp_path.stat().st_size / (1024 * 1024)
                    if size_mb > 20:
                        logger.warning(f"Input too large ({size_mb:.1f} MB): {blob_path}")
                        tmp_path.unlink(missing_ok=True)
                        continue

                    # if safety_checker and safety_checker.test_image(str(tmp_path)):
                    #     logger.info(f"Safety blocked downloaded image: {blob_path}")
                    #     tmp_path.unlink()
                    #     continue

                    # Atomic on local fs; atomic on NFSv4, not guaranteed on NFSv3
                    tmp_path.replace(local_path)
                    logger.debug(f"Cached fresh image: {blob_path}")

                    img = _load_image_from_disk(local_path, blob_path)
                    if img is not None:
                        valid_images.append(img)

                except Exception as e:
                    logger.error(f"Failed to download/process {blob_path}: {e}", exc_info=True)
                    if 'tmp_path' in locals():
                        tmp_path.unlink(missing_ok=True)

        except Timeout:
            logger.warning(f"Lock timeout for {blob_path} — skipping (another pod is probably handling it)")
        except Exception as e:
            logger.error(f"Unexpected error in locked section for {blob_path}: {e}", exc_info=True)

    logger.debug(f"Loaded {len(valid_images)} valid input images")
    return valid_images


def prepare_image_payload(img):
    exif_data = Image.Exif()
    exif_data[ExifTags.Base.Software] = "AI generated"
    exif_data[ExifTags.Base.Make] = "Loom24.ai"

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG', exif=exif_data)
    img_byte_arr.seek(0)
    return img_byte_arr

def upload_result_image(dest_path, img_byte_arr):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_path)
    blob.upload_from_file(img_byte_arr, content_type="image/png")
    logger.debug(f"Image uploaded to {dest_path}")

def upload_result_image_from_local_disk(blob_path):
    local_path = _get_local_image_path(blob_path)
    local_tmp_path = add_tmp_suffix(local_path)
    with open(local_tmp_path, "rb") as f:
        upload_result_image(blob_path, f)

def save_result_image_locally(blob_path, img_byte_arr):
    local_path = _get_local_image_path(blob_path)
    local_tmp_path = str(add_tmp_suffix(local_path))
    
    os.makedirs(os.path.dirname(local_tmp_path), exist_ok=True)
    
    with open(local_tmp_path, "wb") as f:
        f.write(img_byte_arr.getvalue())
    
    return local_tmp_path

def rename_completed_local_image(blob_path):
    local_path = _get_local_image_path(blob_path)
    local_tmp_path = add_tmp_suffix(local_path)

    os.rename(str(local_tmp_path), str(local_path))

def add_tmp_suffix(path: Path) -> Path:
    return path.with_stem(path.stem + "-tmp")
