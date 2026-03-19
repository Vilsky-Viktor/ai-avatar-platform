import subprocess
import tempfile
import os
from PIL import Image

FACEFUSION_DIR = os.environ.get("FACEFUSION_DIR", "/app/facefusion")


def swap_face(source_image: Image.Image, target_image: Image.Image) -> Image.Image:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as src_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tgt_tmp, \
         tempfile.NamedTemporaryFile(suffix=".png", delete=False) as out_tmp:
        source_path = src_tmp.name
        target_path = tgt_tmp.name
        output_path = out_tmp.name

    try:
        source_image.save(source_path)
        target_image.save(target_path)

        subprocess.run([
            "python", f"{FACEFUSION_DIR}/facefusion.py", "headless-run",
            "--source-paths", source_path,
            "--target-path", target_path,
            "--output-path", output_path,
            "--processors", "face_swapper", "face_enhancer",
            "--face-swapper-model", "hyperswap_1a_256",
            "--face-swapper-pixel-boost", "512x512",
            "--face-enhancer-model", "gfpgan_1.4",
            "--execution-providers", "cuda",
            "--skip-download",
            "--log-level", "error"
        ], check=True, cwd=FACEFUSION_DIR)

        return Image.open(output_path).copy()
    finally:
        os.unlink(source_path)
        os.unlink(target_path)
        os.unlink(output_path)