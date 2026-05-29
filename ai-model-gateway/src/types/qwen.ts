import { ImageSizes, Ratios, OutputFormats } from "./image";

export enum ContentTypes {
    png = 'image/png',
    jpg = 'image/jpg'
}

export enum Accelerations {
    none = 'none',
    regular = 'regular',
    high = 'high'
}

export type Image2512In = {
    avatarId: string;
    prompt: string;
    negativePrompt: string;
    ratio: Ratios;
    uploadPath: string;
}

export type Image2512Out = {
    prompt: string;
    negative_prompt: string;
    image_size: ImageSizes;
    num_inference_steps: number;
    guidance_scale: number;
    num_images: number;
    enable_safety_checker: boolean;
    output_format: OutputFormats;
    acceleration: Accelerations
}

export type ImageEdit2511In = {
    avatarId: string;
    prompt: string;
    negativePrompt: string;
    ratio: Ratios;
    imagePaths: string[];
    uploadPath: string;
}

export type ImageEdit2511Out = {
    prompt: string;
    negative_prompt: string;
    image_urls: string[];
    image_size: ImageSizes;
    num_inference_steps: number;
    guidance_scale: number;
    num_images: number;
    enable_safety_checker: boolean;
    output_format: OutputFormats;
    acceleration: Accelerations;
    seed?: number;
}

export type ImageEdit2511MultipleAnglesIn = {
    avatarId: string;
    prompt: string;
    negativePrompt: string;
    ratio: Ratios;
    imagePaths: string[];
    horizontalAngle: number;
    verticalAngle: number;
    zoom: number;
    uploadPath: string;
}

export type ImageEdit2511MultipleAnglesOut = {
    image_urls: string[];
    horizontal_angle: number;
    vertical_angle: number;
    zoom: number;
    additional_prompt: string;
    lora_scale: number;
    image_size: ImageSizes;
    guidance_scale: number;
    num_inference_steps: number;
    acceleration: Accelerations;
    negative_prompt: string;
    enable_safety_checker: boolean;
    output_format: OutputFormats;
    num_images: number;
    seed?: number;
}