import path from 'path';

export const imagesToBase64 = (images: Buffer[]): string[] => {
    return images.map(buffer => buffer.toString('base64'));
};

export const getMimeType = (imagePath: string): string => {
    const ext = path.extname(imagePath).toLowerCase().slice(1);

    const mimeMap: any = {
        jpg:  "image/jpeg",
        jpeg: "image/jpeg",
        png:  "image/png",
        webp: "image/webp",
        gif:  "image/gif",
    };

    return mimeMap[ext];
}