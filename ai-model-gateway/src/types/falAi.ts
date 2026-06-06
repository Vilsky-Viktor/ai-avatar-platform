import { OutputFormats, Ratios } from "./image";
import { Models as JobModels } from './job';

namespace FalAi {
    export enum Statuses {
        queue = 'IN_QUEUE',
        progress = 'IN_PROGRESS',
        completed = 'COMPLETED',
    }

    export enum Models {
        qwenImage2512 = 'qwen-image-2512',
        qwenImageEdit2511 = 'qwen-image-edit-2511',
        qwenImageEdit2512MultipleAnglesLora = 'qwen-image-edit-2511-multiple-angles',
        fluxV2ProEdit = 'flux-2-pro/edit',
        klingV3ProImageToVideo = 'kling-video/v3/pro/image-to-video',
        klingV3ProMotionControl = 'kling-video/v3/pro/motion-control',
        topazImageUpscale = 'topaz/upscale/image',
        topazVideoUpscale = 'topaz/upscale/video',
        lipSyncV3 = 'sync-lipsync/v3',
        elevenV3 = 'elevenlabs/tts/eleven-v3',
        seedvrImageUpscale = 'seedvr/upscale/image',
    }

    export const MODEL_MAPPING: Partial<Record<JobModels,string>> = {
      [JobModels.qwenImage2512]: Models.qwenImage2512,
      [JobModels.qwenImageEdit2511]: Models.qwenImageEdit2511,
      [JobModels.qwenImageEdit2512MultipleAnglesLora]: Models.qwenImageEdit2512MultipleAnglesLora,
      [JobModels.fluxV2ProEdit]: Models.fluxV2ProEdit,
      [JobModels.klingV3ProImageToVideo]: Models.klingV3ProImageToVideo,
      [JobModels.klingV3ProMotionControl]: Models.klingV3ProMotionControl,
      [JobModels.topazImageUpscale]: Models.topazImageUpscale,
      [JobModels.topazVideoUpscale]: Models.topazVideoUpscale,
      [JobModels.lipSyncV3]: Models.lipSyncV3,
      [JobModels.elevenV3]: Models.elevenV3,
      [JobModels.seedvrImageUpscale]: Models.seedvrImageUpscale,
    }

    export enum ImageSizes {
        landscape_4_3 = 'landscape_4_3',
        landscape_16_9 = 'landscape_16_9',
        square_hd = 'square_hd',
        portrait_4_3 = 'portrait_4_3',
        portrait_16_9 = 'portrait_16_9',
    }

    export const RatioToImageSizeMapping: Record<Ratios, ImageSizes> = {
        [Ratios['4:3']]: ImageSizes.landscape_4_3,
        [Ratios['16:9']]: ImageSizes.landscape_16_9,
        [Ratios['1:1']]: ImageSizes.square_hd,
        [Ratios['3:4']]: ImageSizes.portrait_4_3,
        [Ratios['9:16']]: ImageSizes.portrait_16_9,
    }

    export enum TextNormalizations {
        auto = 'auto',
        on = 'on',
        off = 'off'
    }

    export enum ShotTypes {
        customize = 'customize',
        intelligent = 'intelligent',
    }

    export enum ContentTypes {
        png = 'image/png',
        jpg = 'image/jpg'
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

    export enum Accelerations {
        none = 'none',
        regular = 'regular',
        high = 'high'
    }

    export enum SeedvrUpscaleModes {
        target = 'target',
        factor = 'factor'
    }

    export enum LipSyncModes {
        cutOff = 'cut_off',
        loop = 'loop',
        bounce = 'bounce',
        silence = 'silence',
        remap = 'remap',
    }

    export enum TopazImageModels {
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

    export enum TopazVideoModels {
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

    export type ElevenLabsElevenV3 = {
        text: string;
        voice: string;
        stability: number;
        timestamps?: boolean;
        language_code?: string;
        apply_text_normalization: TextNormalizations;
    }

    export type FluxV2ProEdit = {
        prompt: string;
        image_size: ImageSizes;
        safety_tolerance: number;
        seed?: number;
        output_format: OutputFormats;
        image_urls: string[];
        enable_safety_checker: boolean;
    }

    export type KlingV3ProImageToVideo = {
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

    export type KlingV3ProMotionControl = {
        prompt: string;
        image_url: string;
        video_url: string;
        keep_original_sound: boolean;
        character_orientation: CharacterOrientations;
        elements: ImageElement[] | null;
    }

    export type QwenImage2512 = {
        prompt: string;
        negative_prompt: string;
        image_size: ImageSizes;
        num_inference_steps: number;
        guidance_scale: number;
        num_images: number;
        enable_safety_checker: boolean;
        output_format: OutputFormats;
        acceleration: Accelerations;
    }

    export type QwenImageEdit2511 = {
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

    export type QwenImageEdit2511MultipleAnglesLora = {
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

    export type SeedvrUpscaleImage = {
        image_url: string;
        upscale_mode: SeedvrUpscaleModes;
        upscale_factor: number;
        target_resolution?: string;
        seed?: number;
        noise_scale: number;
        output_format: OutputFormats;
    }

    export type LipSyncv3 = {
        video_url: string;
        audio_url: string;
        sync_mode: LipSyncModes;
    }

    export type TopazUpscaleImage = {
        model: TopazImageModels;
        upscale_factor: number;
        crop_to_fill?: boolean;
        image_url: string;
        output_format: OutputFormats;
        subject_detection: SubjectDetections;
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

    export type TopazUpscaleVideo = {
        video_url: string;
        model: TopazVideoModels;
        upscale_factor: number;
        target_fps?: number;
        compression?: number;
        noise?: number;
        halo?: number;
        grain?: number;
        recover_detail?: number;
        H264_output?: boolean;
    }
}

export default FalAi;
