import { OutputFormats } from "./image";

export enum ImageModels {
    lowResolutionV2 = 'Low Resolution V2',
    standardV2 = 'Standard V2',
    CGI = 'CGI',
    highFidelityV2 = 'High Fidelity V2',
    textRefine = 'Text Refine',
    recovery = 'Recovery',
    redefine = 'Redefine',
    recoveryV2 = 'Recovery V2',
    standardMAX = 'Standard MAX',
    wonder = 'Wonder'
}

export enum VideoModels {
    proteus = 'Proteus',
    artemisHQ = 'Artemis HQ',
    artemisMQ = 'Artemis MQ',
    artemisLQ = 'Artemis LQ',
    nyx = 'Nyx',
    nyxFast = 'Nyx Fast',
    nyxXL = 'Nyx XL',
    nyxHF = 'Nyx HF',
    gaiaHQ = 'Gaia HQ',
    gaiaCG = 'Gaia CG',
    gaia2 = 'Gaia 2',
    starlightPrecise1 = 'Starlight Precise 1',
    starlightPrecise2 = 'Starlight Precise 2',
    starlightPrecise2_5 = 'Starlight Precise 2.5',
    starlightHQ = 'Starlight HQ',
    starlightMini = 'Starlight Mini',
    starlightSharp = 'Starlight Sharp',
    starlightFast1 = 'Starlight Fast 1',
    starlightFast2 = 'Starlight Fast 2'
}

export enum SubjectDetections {
    all = 'All',
    foreground = 'Foreground',
    background = 'Background'
}

export type UpscaleImageIn = {
    avatarId: string;
    imagePath: string;
    uploadPath: string;
}

export type UpscaleImageOut = {
    model: ImageModels;
    upscale_factor: number;
    crop_to_fill?: boolean;
    image_url: string;
    output_format: OutputFormats;
    subject_detection: SubjectDetections,
    face_enhancement: boolean;
    face_enhancement_creativity?: number;
    face_enhancement_strength?: number;
    sharpen?: number;
    denoise?: number;
    fix_compression?: number;
    strength?: number;
    creativity?: number;
    texture?: number;
    prompt?: string;
    autoprompt?: boolean;
    detail?: number;
}

export type UpscaleVideoIn = {
    avatarId: string;
    videoPath: string;
    uploadPath: string;
}

export type UpscaleVideoOut = {
    video_url: string;
    model: VideoModels;
    upscale_factor: number;
    target_fps?: number;
    compression?: number;
    noise?: number;
    halo?: number;
    grain?: number;
    recover_detail?: number;
    H264_output?: boolean;
}