import numpy as np
import torch
from PIL import Image


def get_image_latent(ref_image=None, sample_size=None, padding=False):
    if ref_image is not None:
        if isinstance(ref_image, str):
            ref_image = Image.open(ref_image).convert("RGB")
            if padding:
                ref_image = _padding_image(ref_image, sample_size[1], sample_size[0])
            ref_image = ref_image.resize((sample_size[1], sample_size[0]))
            ref_image = torch.from_numpy(np.array(ref_image))
            ref_image = ref_image.unsqueeze(0).permute([3, 0, 1, 2]).unsqueeze(0) / 255
        elif isinstance(ref_image, Image.Image):
            ref_image = ref_image.convert("RGB")
            if padding:
                ref_image = _padding_image(ref_image, sample_size[1], sample_size[0])
            ref_image = ref_image.resize((sample_size[1], sample_size[0]))
            ref_image = torch.from_numpy(np.array(ref_image))
            ref_image = ref_image.unsqueeze(0).permute([3, 0, 1, 2]).unsqueeze(0) / 255
        else:
            ref_image = torch.from_numpy(np.array(ref_image))
            ref_image = ref_image.unsqueeze(0).permute([3, 0, 1, 2]).unsqueeze(0) / 255
    return ref_image


def get_image(ref_image=None):
    if ref_image is not None:
        if isinstance(ref_image, str):
            ref_image = Image.open(ref_image).convert("RGB")
        elif isinstance(ref_image, Image.Image):
            ref_image = ref_image.convert("RGB")
    return ref_image


def _padding_image(images, new_width, new_height):
    new_image = Image.new('RGB', (new_width, new_height), (255, 255, 255))
    aspect_ratio = images.width / images.height
    if aspect_ratio > new_width / new_height:
        new_img_width = new_width
        new_img_height = int(new_img_width / aspect_ratio)
    else:
        new_img_height = new_height
        new_img_width = int(new_img_height * aspect_ratio)
    resized_img = images.resize((new_img_width, new_img_height))
    paste_x = (new_width - new_img_width) // 2
    paste_y = (new_height - new_img_height) // 2
    new_image.paste(resized_img, (paste_x, paste_y))
    return new_image
