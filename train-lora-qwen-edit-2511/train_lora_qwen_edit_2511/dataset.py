import random

import torch
from PIL import Image
from PIL.ImageOps import exif_transpose
from torch.utils.data import Dataset
from torchvision import transforms

# Aspect ratio buckets: (width, height) pairs.
# Must be divisible by vae_scale_factor * 2 (= 16 for this VAE).
# Ordered by aspect ratio priority — num_buckets slices this list.
ASPECT_RATIO_BUCKETS = [
    (1328, 1328),  # 1:1
    (928, 1664),   # 9:16 portrait
    (1104, 1472),  # 3:4 portrait
]


def _nearest_bucket(img: Image.Image, num_buckets: int) -> tuple[int, int]:
    """Return the (width, height) bucket closest in aspect ratio to the image."""
    w, h = img.size
    ratio = w / h
    buckets = ASPECT_RATIO_BUCKETS[:max(1, num_buckets)]
    return min(buckets, key=lambda b: abs(b[0] / b[1] - ratio))


def _resize_and_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale so the shorter side fills the target, then center-crop."""
    scale = max(target_w / img.width, target_h / img.height)
    new_w = round(img.width * scale)
    new_h = round(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


_to_tensor = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5]),
])


class TrainingDataset(Dataset):
    """
    Dataset for person LoRA training.
    Each image is paired with a prompt provided at the same index in `prompts`.
    The prompt is expected to already contain the trigger word.
    Images are snapped to the nearest aspect-ratio bucket and repeated.
    """

    def __init__(
        self,
        images: list[Image.Image],
        prompts: list[str],
        num_buckets: int = 1,
        repeats: int = 10,
        random_flip: bool = True,
    ):
        assert len(images) == len(prompts), "images and prompts must have the same length"
        self.random_flip = random_flip

        self.entries: list[tuple[torch.Tensor, str, tuple[int, int]]] = []

        for img, prompt in zip(images, prompts):
            img = exif_transpose(img).convert("RGB")
            bucket_w, bucket_h = _nearest_bucket(img, num_buckets)
            resized = _resize_and_crop(img, bucket_w, bucket_h)

            for _ in range(repeats):
                tensor = _augment(resized, self.random_flip)
                self.entries.append((tensor, prompt, (bucket_h, bucket_w)))

    def __len__(self) -> int:
        return len(self.entries)

    def __getitem__(self, idx: int) -> dict:
        pixel_values, prompt, img_shape = self.entries[idx]
        return {
            "pixel_values": pixel_values,
            "prompt": prompt,
            "img_shape": img_shape,  # (H, W) — passed to transformer
        }


def _augment(img: Image.Image, random_flip: bool) -> torch.Tensor:
    if random_flip and random.random() < 0.5:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return _to_tensor(img)


def collate_fn(examples: list[dict]) -> dict:
    return {
        "pixel_values": torch.stack([e["pixel_values"] for e in examples]),
        "prompts": [e["prompt"] for e in examples],
        "img_shapes": [e["img_shape"] for e in examples],
    }
