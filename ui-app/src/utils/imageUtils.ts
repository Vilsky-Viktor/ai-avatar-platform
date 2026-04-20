import type { Area } from 'react-easy-crop';

export const getCroppedImg = async (imageSrc: string, pixelCrop: Area, cropSize: [number, number]): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = cropSize[0];
    canvas.height = cropSize[1];
    const ctx = canvas.getContext('2d');

    if (!ctx) return "";

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        cropSize[0],
        cropSize[1]
    );

    return canvas.toDataURL('image/jpeg', 0.9);
};
