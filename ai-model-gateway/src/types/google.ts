import { OutputMimeTypes, Ratios } from "./image"

export enum PersonGenerations {
    dontAllow = 'dont_allow',
    allowAdult = 'allow_adult'
}

export enum EditModes {
    default = 'DEFAULT',
    creative = 'CREATIVE',
    precise = 'PRECISE' // Fixed the typo here
}

export enum ImageSizes {
    _1k = '1K',
    _2k = '2K',
    _4k = '4K'
}
export type GeminiImageConfig = {
    aspectRatio?: Ratios;
    imageOutputFormat?: OutputMimeTypes;
    personGeneration?: PersonGenerations;
    editMode?: EditModes;
    imageSize?: ImageSizes;
}

export type GenImage3ProOut = {
    candidateCount?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    imageConfig?: GeminiImageConfig; 
}

export type GenImage3ProIn = {
    prompt: string;
    imagePaths: string[];
    uploadPath: string;
    ratio: Ratios;
    imageSize: ImageSizes;
    temperature: number;
}