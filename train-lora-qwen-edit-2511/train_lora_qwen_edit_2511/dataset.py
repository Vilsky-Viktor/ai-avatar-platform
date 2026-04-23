import random

import torch
from PIL import Image
from PIL.ImageOps import exif_transpose
from torch.utils.data import Dataset
from torchvision import transforms

TARGET_SIZE = 1328


def _resize_and_crop(img: Image.Image) -> Image.Image:
    """Scale so the shorter side fills TARGET_SIZE, then center-crop to square."""
    scale = TARGET_SIZE / min(img.width, img.height)
    new_w = round(img.width * scale)
    new_h = round(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - TARGET_SIZE) // 2
    top = (new_h - TARGET_SIZE) // 2
    return img.crop((left, top, left + TARGET_SIZE, top + TARGET_SIZE))


_to_tensor = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5]),
])


class TrainingDataset(Dataset):
    def __init__(
        self,
        images: list[Image.Image],
        prompts: list[str],
        repeats: int = 10,
        random_flip: bool = True,
    ):
        assert len(images) == len(prompts), "images and prompts must have the same length"
        self.random_flip = random_flip

        self.entries: list[tuple[torch.Tensor, str]] = []

        for img, prompt in zip(images, prompts):
            img = exif_transpose(img).convert("RGB")
            resized = _resize_and_crop(img)
            for _ in range(repeats):
                tensor = _augment(resized, self.random_flip)
                self.entries.append((tensor, prompt))

    def __len__(self) -> int:
        return len(self.entries)

    def __getitem__(self, idx: int) -> dict:
        pixel_values, prompt = self.entries[idx]
        return {
            "pixel_values": pixel_values,
            "prompt": prompt,
            "img_shape": (TARGET_SIZE, TARGET_SIZE),
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
