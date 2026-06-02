import { ImageSizes, Ratios, OutputFormats } from "./image";

export type V2ProEditIn = {
    avatarId: string;
    prompt: string;
    ratio: Ratios;
    imagePaths: string[];
    safetyTolerance: number;
    uploadPath: string;
}

export type V2ProEditOut = {
    prompt: string;
    image_size: ImageSizes;
    safety_tolerance: number;
    seed?: number;
    output_format: OutputFormats;
    image_urls: string[];
    enable_safety_checker: boolean;
}