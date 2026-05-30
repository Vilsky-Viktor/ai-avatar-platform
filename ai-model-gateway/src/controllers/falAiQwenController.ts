import { Request, Response, NextFunction } from 'express';
import { Accelerations, Image2512In, Image2512Out, ImageEdit2511In, ImageEdit2511MultipleAnglesIn, ImageEdit2511MultipleAnglesOut, ImageEdit2511Out } from '../types/qwen';
import { RatioToImageSizeMapping, OutputFormats } from '../types/image';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { ImagesResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const genImage2512 = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as Image2512In;
  const modelName = 'qwen-image-2512';

  const payload: Image2512Out = {
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    image_size: RatioToImageSizeMapping[input.ratio],
    num_inference_steps: 50,
    guidance_scale: 4,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: Accelerations.regular
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImagesResponse;
    const resultMediaUrl = resultData.images[0].url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Qwen Image 2512: ${error}`);
    next(error);
  }
}

export const genImageEdit2511 = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as ImageEdit2511In;
  const modelName = 'qwen-image-edit-2511';

  const imageUrls = await Promise.all(input.imagePaths.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: ImageEdit2511Out = {
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    image_urls: imageUrls,
    image_size: RatioToImageSizeMapping[input.ratio],
    num_inference_steps: 50,
    guidance_scale: 4.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: Accelerations.regular
  }
  
  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImagesResponse;
    const resultMediaUrl = resultData.images[0].url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Qwen Image Edit 2511: ${error}`);
    next(error);
  }
}

export const genImageEdit2511MultipleAngles = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as ImageEdit2511MultipleAnglesIn;
  const modelName = 'qwen-image-edit-2511-multiple-angles';

  const imageUrls = await Promise.all(input.imagePaths.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: ImageEdit2511MultipleAnglesOut = {
    additional_prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    image_urls: imageUrls,
    image_size: RatioToImageSizeMapping[input.ratio],
    horizontal_angle: input.horizontalAngle,
    vertical_angle: input.verticalAngle,
    zoom: input.zoom,
    num_inference_steps: 50,
    guidance_scale: 4.5,
    num_images: 1,
    enable_safety_checker: false,
    output_format: OutputFormats.png,
    acceleration: Accelerations.regular,
    lora_scale: 1.0,
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImagesResponse;
    const resultMediaUrl = resultData.images[0].url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Qwen Image Edit 2511 Multiple Angles: ${error}`);
    next(error);
  }
}