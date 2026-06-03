import { Ratios } from "./video";

export enum ShotTypes {
    customize = 'customize',
    intelligent = 'intelligent',
}

export enum CharacterOrientations {
    image = 'image',
    video = 'video',
}

export type MultiPrompt = {
    prompt: string;
    duration: number;
}

export type ImageElement = {
    frontal_image_url: string;
    reference_image_urls: string[];
}

export type VideoElement = {
    video_url: string;
}

export type VideoV3ProImageToVideoIn = {
    avatarId: string;
    prompt: string;
    negativePrompt: string;
    imagePath: string;
    imageRefPaths: string[];
    objectRefPaths: string[] | null;
    duration: number;
    ratio: Ratios;
    uploadPath: string;
}

export type VideoV3ProImageToVideoOut = {
    prompt: string;
    multi_prompt?: MultiPrompt | null;
    start_image_url: string;
    duration: string;
    generate_audio: boolean;
    end_image_url?: string;
    elements: (ImageElement | VideoElement)[] | null;
    shot_type: ShotTypes;
    negative_prompt: string;
    cfg_scale: number;
}

export type VideoV3ProMotionControlIn = {
    avatarId: string;
    imagePath: string;
    videoPath: string;
    imageRefPaths: string[];
    keepOriginalAudio: boolean;
    uploadPath: string;
}

export type VideoV3ProMotionControlOut = {
    prompt: string;
    image_url: string;
    video_url: string;
    keep_original_sound: boolean;
    character_orientation: CharacterOrientations;
    elements: ImageElement[] | null;
}