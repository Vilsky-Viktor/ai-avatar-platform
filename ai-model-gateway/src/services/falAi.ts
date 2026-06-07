import { fal, QueueStatus } from "@fal-ai/client";
import { getSecretValue } from "./secretManager";
import falAiTypes from '../types/falAi';
import logger from '@loom24/shared/logger';
import { AiModelGateway, MediaTypes, Models, ImageRatios } from "@loom24/shared/types";
import platform from '../types/platform';
import { downloadResultFile, getMediaUrlFromPath } from '@loom24/shared/services';
import { OutputFormats } from "@loom24/shared/types";

export const authenticate = async () => {
    fal.config({
        credentials: await getSecretValue('FAL_AI_API_KEY'),
    });
}

export const getPlatformModelName = (model: Models): string => {
    const mapped = falAiTypes.MODEL_MAPPING[model];
    if (!mapped) throw new Error(`No fal.ai model mapping for: ${model}`);
    return `fal-ai/${mapped}`;
}

export const generate = async <Input extends Record<string, any>>(data: AiModelGateway, payload: Input): Promise<platform.GeneratedData> => {
    const modelPath = getPlatformModelName(data.model!);

    const result = await fal.subscribe(modelPath, {
        input: payload,
        logs: false,
    });

    const resultData = result.data;
    let resultUrl: string;

    if ('image' in resultData) {
      resultUrl = resultData.image.url;
    } else if ('video' in resultData) {
      resultUrl = resultData.video.url;
    } else if ('images' in resultData) {
      resultUrl = resultData.images[0].url;
    } else {
      resultUrl = resultData.audio.url;
    }

    return await downloadResultFile(resultUrl);
}

export const genElevenLabsElevenV3 = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const payload: falAiTypes.ElevenLabsElevenV3 = {
    text: data.prompt!,
    voice: data.voice!,
    stability: 0.5,
    apply_text_normalization: falAiTypes.TextNormalizations.auto
  }

  return {
    type: MediaTypes.audio,
    data: await generate(data, payload)
  };
}

export const genFluxV2ProEdit = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrls = await Promise.all(data.imagePaths!.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: falAiTypes.FluxV2ProEdit = {
    prompt: data.prompt!,
    image_urls: imageUrls,
    image_size: falAiTypes.RatioToImageSizeMapping[data.ratio! as ImageRatios],
    output_format: OutputFormats.png,
    safety_tolerance: data.safetyTolerance || 2,
    enable_safety_checker: false
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genKlingV3ProImageToVideo = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  let objectElements = [];

  const imageUrl = await getMediaUrlFromPath(data.imagePaths![0]);
  const idPhotoUrls = await Promise.all(data.idPhotoPaths!.map((imageRefPath: string) => getMediaUrlFromPath(imageRefPath)));

  const characterElement: falAiTypes.ImageElement = {
    frontal_image_url: idPhotoUrls[0],
    reference_image_urls: idPhotoUrls.slice(1),
  }

  if (data.objectRefPaths && data.objectRefPaths.length >= 2) {
    const objectImageRefUrls = await Promise.all(data.objectRefPaths.map((objectRefPath: string) => getMediaUrlFromPath(objectRefPath)));

    const objectElement: falAiTypes.ImageElement = {
        frontal_image_url: objectImageRefUrls[0],
        reference_image_urls: objectImageRefUrls.slice(1),
    }

    objectElements.push(objectElement)
  }

  const payload: falAiTypes.KlingV3ProImageToVideo = {
    prompt: data.prompt!,
    elements: [...objectElements, characterElement],
    negative_prompt: data.negativePrompt || '',
    start_image_url: imageUrl,
    duration: data.duration!.toString(),
    generate_audio: false,
    shot_type: falAiTypes.ShotTypes.customize,
    cfg_scale: 0.5
  }

  return {
    type: MediaTypes.video,
    data: await generate(data, payload)
  };
}

export const genKlingV3ProMotionControl = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrl = await getMediaUrlFromPath(data.imagePaths![0]);
  const videoUrl = await getMediaUrlFromPath(data.videoPaths![0]);
  const idPhotoUrls = await Promise.all(data.idPhotoPaths!.map((imageRefPath: string) => getMediaUrlFromPath(imageRefPath)));

  const element: falAiTypes.ImageElement = {
    frontal_image_url: idPhotoUrls[0],
    reference_image_urls: idPhotoUrls.slice(1),
  }

  const payload: falAiTypes.KlingV3ProMotionControl = {
    prompt: `Mimic motion with @Element1 identity`,
    image_url: imageUrl,
    video_url: videoUrl,
    keep_original_sound: data.keepOriginalAudio || false,
    character_orientation: falAiTypes.CharacterOrientations.video,
    elements: [element]
  }

  return {
    type: MediaTypes.video,
    data: await generate(data, payload)
  };
}

export const genQwenImage2512 = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const payload: falAiTypes.QwenImage2512 = {
    prompt: data.prompt!,
    negative_prompt: data.negativePrompt || '',
    image_size: falAiTypes.RatioToImageSizeMapping[data.ratio! as ImageRatios],
    num_inference_steps: 50,
    guidance_scale: 4,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: falAiTypes.Accelerations.regular
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genQwenImageEdit2511 = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrls = await Promise.all(data.imagePaths!.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: falAiTypes.QwenImageEdit2511 = {
    prompt: data.prompt!,
    negative_prompt: data.negativePrompt || '',
    image_urls: imageUrls,
    image_size: falAiTypes.RatioToImageSizeMapping[data.ratio! as ImageRatios],
    num_inference_steps: 50,
    guidance_scale: 4.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: falAiTypes.Accelerations.regular
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genQwenImageEdit2511MultipleAnglesLora = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrls = await Promise.all(data.imagePaths!.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: falAiTypes.QwenImageEdit2511MultipleAnglesLora = {
    additional_prompt: data.prompt!,
    negative_prompt: data.negativePrompt || '',
    image_urls: imageUrls,
    image_size: falAiTypes.RatioToImageSizeMapping[data.ratio! as ImageRatios],
    horizontal_angle: data.horizontalAngle || 0,
    vertical_angle: data.verticalAngle || 0,
    zoom: data.zoom || 0,
    num_inference_steps: 50,
    guidance_scale: 4.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: falAiTypes.Accelerations.regular,
    lora_scale: 1.0,
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genSeedvrImageUpscale = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrl = await getMediaUrlFromPath(data.imagePaths![0]);

  const payload: falAiTypes.SeedvrUpscaleImage = {
    image_url: imageUrl,
    upscale_mode: falAiTypes.SeedvrUpscaleModes.factor,
    upscale_factor: 2,
    noise_scale: 0.1,
    output_format: OutputFormats.png
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genLipSyncV3 = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const videoUrl = await getMediaUrlFromPath(data.videoPaths![0]);
  const audioUrl = await getMediaUrlFromPath(data.audioPaths![0]);

  const payload: falAiTypes.LipSyncv3 = {
    video_url: videoUrl,
    audio_url: audioUrl,
    sync_mode: falAiTypes.LipSyncModes.cutOff,
  }

  return {
    type: MediaTypes.video,
    data: await generate(data, payload)
  };
}

export const genTopazImageUpscale = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const imageUrl = await getMediaUrlFromPath(data.imagePaths![0]);

  const payload: falAiTypes.TopazUpscaleImage = {
    model: falAiTypes.TopazImageModels.standardV2,
    upscale_factor: 2,
    image_url: imageUrl,
    output_format: OutputFormats.png,
    subject_detection: falAiTypes.SubjectDetections.all,
    face_enhancement: true,
    face_enhancement_strength: 0.8
  }

  return {
    type: MediaTypes.image,
    data: await generate(data, payload)
  };
}

export const genTopazVideoUpscale = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
  const videoUrl = await getMediaUrlFromPath(data.videoPaths![0]);

  const payload: falAiTypes.TopazUpscaleVideo = {
      video_url: videoUrl,
      model: falAiTypes.TopazVideoModels.proteus,
      upscale_factor: 2
  }

  return {
    type: MediaTypes.video,
    data: await generate(data, payload)
  };
}

export default {
    authenticate,
    generate,
    genElevenLabsElevenV3,
    genFluxV2ProEdit,
    genKlingV3ProImageToVideo,
    genKlingV3ProMotionControl,
    genQwenImage2512,
    genQwenImageEdit2511,
    genQwenImageEdit2511MultipleAnglesLora,
    genSeedvrImageUpscale,
    genLipSyncV3,
    genTopazImageUpscale,
    genTopazVideoUpscale
}