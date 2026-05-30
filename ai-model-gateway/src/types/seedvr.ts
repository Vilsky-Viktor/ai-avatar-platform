import { OutputFormats } from "./image";

export enum UpscaleModes {
    target = 'target',
    factor = 'factor'
}

export type UpscaleImageIn = {
    avatarId: string;
    imagePath: string;
    uploadPath: string;
}

export type UpscaleImageOut = {
    image_url: string;
    upscale_mode: UpscaleModes;
    upscale_factor: number;
    target_resolution?: string;
    seed?: number;
    noise_scale: number;
    output_format: OutputFormats
}