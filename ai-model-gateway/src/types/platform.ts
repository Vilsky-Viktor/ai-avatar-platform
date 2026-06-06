import falAitypes from './falAi';
import { Models, JobStatuses, Platforms, AiModelGateway, MediaTypes } from "@loom24/shared/types";
import falAiService from '../services/falAi';
import googleService from '../services/google';

namespace Platform {
    export type HandlerResponse = {
        type: MediaTypes;
        data: Buffer | string;
    }

    export type ModelHandler = (data: AiModelGateway) => Promise<HandlerResponse>;
    export type GeneratedData = Buffer | string;

    export interface PlatformService {
      generate: (...args: any[]) => Promise<GeneratedData>;
      genElevenLabsElevenV3?: ModelHandler;
      genFluxV2ProEdit?: ModelHandler;
      genKlingV3ProImageToVideo?: ModelHandler;
      genKlingV3ProMotionControl?: ModelHandler;
      genQwenImage2512?: ModelHandler;
      genQwenImageEdit2511?: ModelHandler;
      genQwenImageEdit2511MultipleAnglesLora?: ModelHandler;
      genSeedvrImageUpscale?: ModelHandler;
      genLipSyncV3?: ModelHandler;
      genTopazImageUpscale?: ModelHandler;
      genTopazVideoUpscale?: ModelHandler;
      genGeminiImage3Pro?: ModelHandler;
    }

    export const PLATFORM_TO_SERVICE_MAPPING: Partial<Record<Platforms, PlatformService>> = {
      [Platforms.falai]: falAiService,
      [Platforms.google]: googleService,
    }

    export const MODEL_TO_FUNCTION_MAPPING: Partial<Record<Models, keyof PlatformService>> = {
        [Models.qwenImage2512]: 'genQwenImage2512',
        [Models.qwenImageEdit2511]: 'genQwenImageEdit2511',
        [Models.qwenImageEdit2512MultipleAnglesLora]: 'genQwenImageEdit2511MultipleAnglesLora',
        [Models.fluxV2ProEdit]: 'genFluxV2ProEdit',
        [Models.klingV3ProImageToVideo]: 'genKlingV3ProImageToVideo',
        [Models.klingV3ProMotionControl]: 'genKlingV3ProMotionControl',
        [Models.elevenV3]: 'genElevenLabsElevenV3',
        [Models.lipSyncV3]: 'genLipSyncV3',
        [Models.seedvrImageUpscale]: 'genSeedvrImageUpscale',
        [Models.topazImageUpscale]: 'genTopazImageUpscale',
        [Models.topazVideoUpscale]: 'genTopazVideoUpscale',
        [Models.geminiImage3Pro]: 'genGeminiImage3Pro',
    }
}

export default Platform;
