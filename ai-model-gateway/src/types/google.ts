import { OutputMimeTypes, Ratios } from "./image"
import { Models as JobModels } from './job';

namespace Google {
    export enum Models {
        geminiImage3Pro = 'gemini-3-pro-image',
    }

    export const MODEL_MAPPING: Partial<Record<JobModels,string>> = {
      [JobModels.geminiImage3Pro]: Models.geminiImage3Pro,
    }

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
        personGeneration?: PersonGenerations;
        imageSize?: ImageSizes;
        imageOutputFormat?: OutputMimeTypes;
        editMode: EditModes;
    }

    export type GeminiImage3Pro = {
        candidateCount?: number;
        temperature?: number;
        topP?: number;
        topK?: number;
        imageConfig?: GeminiImageConfig;
    }
}

export default Google;
