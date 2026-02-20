import os
import io
import tempfile
import uuid
from pathlib import Path
from google.cloud import storage
from PIL import Image, ExifTags
from gen_text_image_to_image_service.logger import get_logger

logger = get_logger(__name__)
storage_client = storage.Client()

BUCKET_NAME = os.getenv("BUCKET_NAME", "loom24-mvp.firebasestorage.app")
BUCKET_MODELS_PATH = "models"
LOCAL_MODELS_PATH = "/workspace/models"

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

            if not blob.exists():
                logger.warning(f"Input image not found in GCS: {image_path}")
                continue

            local_filename = tmp_path / f"{uuid.uuid4()}_{Path(image_path).name}"
            
            try:
                logger.debug(f"Downloading input: {image_path} → {local_filename}")
                blob.download_to_filename(str(local_filename))

                if local_filename.stat().st_size > 20 * 1024 * 1024:
                    logger.warning(f"Input too large ({local_filename.stat().st_size / 1024**2:.1f} MB): {image_path}")
                    local_filename.unlink()
                    continue

                if safety_checker.test_image(str(local_filename)):
                    logger.info(f"Safety check blocked input: {image_path}")
                    local_filename.unlink()
                    continue

                img = Image.open(local_filename).convert("RGB")
                img_ctx.append(img)
                
                local_filename.unlink()

            except Exception as e:
                logger.error(f"Failed to process input {image_path}: {e}", exc_info=True)
                if local_filename.exists():
                    local_filename.unlink()

    logger.info(f"Loaded {len(img_ctx)} valid input images")
    return img_ctx

def prepare_image_payload(img):
    """Applies EXIF data and converts PIL Image to bytes."""
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
    logger.info(f"Image uploaded to {dest_path}")