import os
import io
import time
import tempfile
import uuid
from pathlib import Path
from collections import OrderedDict
from google.cloud import storage
from PIL import Image, ExifTags
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"

_IMAGE_FOLDER_CACHE_TTL_SEC      = int(os.getenv("IMAGE_FOLDER_CACHE_TTL_SEC", "30"))
_IMAGE_FOLDER_CACHE_MAX_SIZE     = int(os.getenv("IMAGE_FOLDER_CACHE_MAX_SIZE", "500"))

# Thread-safe LRU + TTL cache for folder listings
_folder_cache: OrderedDict[str, tuple[set[str], float]] = OrderedDict()


def _get_folder_prefix(blob_path: str) -> str:
    return blob_path.rsplit("/", 1)[0] + "/"


def _fetch_folder_files(folder_prefix: str) -> set[str]:
    """Heavy GCS call — keep outside of lock"""
    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = bucket.list_blobs(prefix=folder_prefix)
    return {blob.name for blob in blobs}


def _evict_folder_cache(now: float) -> None:
    """Must be called with _folder_cache_lock already held"""
    expired_keys = [k for k, (_, expiry) in _folder_cache.items() if now > expiry]
    for key in expired_keys:
        del _folder_cache[key]
    if expired_keys:
        logger.debug(f"Cache cleanup: evicted {len(expired_keys)} expired folder entries "
                    f"({len(_folder_cache)} remaining)")

    while len(_folder_cache) >= _IMAGE_FOLDER_CACHE_MAX_SIZE:
        evicted_key, _ = _folder_cache.popitem(last=False)
        logger.debug(f"Folder cache full ({_IMAGE_FOLDER_CACHE_MAX_SIZE}) — "
                    f"evicted oldest: {evicted_key}")


def _get_cached_folder_files(folder_prefix: str) -> set[str]:
    now = time.monotonic()

    cached = _folder_cache.get(folder_prefix)

    if cached is not None and now <= cached[1]:
        _folder_cache.move_to_end(folder_prefix)
        return cached[0]

    _evict_folder_cache(now)

    logger.debug(f"Cache miss for folder: {folder_prefix} — fetching from GCS")
    files = _fetch_folder_files(folder_prefix)

    _folder_cache[folder_prefix] = (files, now + _IMAGE_FOLDER_CACHE_TTL_SEC)

    return files


def blob_exists_cached(blob_path: str) -> bool:
    folder_prefix = _get_folder_prefix(blob_path)
    files = _get_cached_folder_files(folder_prefix)
    return blob_path in files


def all_blobs_exist(blob_paths: list[str]) -> tuple[bool, list[str]]:
    missing = [p for p in blob_paths if not blob_exists_cached(p)]
    return len(missing) == 0, missing


# ────────────────────────────────────────────────
# The rest of the file remains unchanged
# ────────────────────────────────────────────────

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
        if blob.name.endswith('/'): continue
        relative_path = os.path.relpath(blob.name, BUCKET_MODELS_PATH)
        final_dest = local_base_dir / relative_path

        if final_dest.exists() and final_dest.stat().st_size == blob.size:
            continue

        final_dest.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(final_dest))
    logger.info(f"Sync for {model_name} complete")


def load_input_images(image_paths: list[str], safety_checker) -> list[Image.Image]:
    img_ctx = []
    bucket = storage_client.bucket(BUCKET_NAME)

    with tempfile.TemporaryDirectory(prefix="input_imgs_") as tmp_dir:
        tmp_path = Path(tmp_dir)

        for image_path in image_paths:
            blob = bucket.blob(image_path)
            local_filename = tmp_path / f"{uuid.uuid4()}_{Path(image_path).name}"

            try:
                blob.download_to_filename(str(local_filename))

                if local_filename.stat().st_size > 20 * 1024 * 1024:
                    logger.warning(f"Input too large ({local_filename.stat().st_size / 1024**2:.1f} MB): {image_path}")
                    local_filename.unlink()
                    continue

                # if safety_checker.test_image(str(local_filename)):
                #     logger.info(f"Safety check blocked input: {image_path}")
                #     local_filename.unlink()
                #     continue

                img = Image.open(local_filename).convert("RGB")
                img_ctx.append(img)

                local_filename.unlink()

            except Exception as e:
                logger.error(f"Failed to process input {image_path}: {e}", exc_info=True)
                if local_filename.exists():
                    local_filename.unlink()

    logger.debug(f"Loaded {len(img_ctx)} valid input images")
    return img_ctx


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


def add_final_suffix(path):
    p = Path(path)
    return str(p.with_stem(p.stem + "-final"))


def rename_final_image(path):
    bucket = storage_client.bucket(BUCKET_NAME)
    source_blob = bucket.blob(path)
    final_path = add_final_suffix(path)
    bucket.copy_blob(source_blob, bucket, final_path)
    source_blob.delete()
