import { Request, Response, NextFunction } from 'express';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { CharacterOrientations, ImageElement, ShotTypes, VideoV3ProImageToVideoIn, VideoV3ProImageToVideoOut, VideoV3ProMotionControlIn, VideoV3ProMotionControlOut } from '../types/kling';
import { VideoResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const genVideoV3ProImageToVideo = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as VideoV3ProImageToVideoIn;
  const modelName = 'kling-video/v3/pro/image-to-video';
  const userId = req.headers['x-user-id'] as string;
  let objectElements = [];

  const imageUrl = await getMediaUrlFromPath(input.imagePath);
  const imageRefUrls = await Promise.all(input.imageRefPaths.map((imageRefPath: string) => getMediaUrlFromPath(imageRefPath)));

  const element: ImageElement = {
    frontal_image_url: imageRefUrls[0],
    reference_image_urls: [imageRefUrls[1], imageRefUrls[2], imageRefUrls[3]]
  }

  if (input.objectRefPaths) {
    const objectImageRefUrls = await Promise.all(input.objectRefPaths.map((objectRefPath: string) => getMediaUrlFromPath(objectRefPath)));

    const objectElement: ImageElement = {
        frontal_image_url: objectImageRefUrls[0],
        reference_image_urls: [objectImageRefUrls[1], objectImageRefUrls[2], objectImageRefUrls[3]]
    }

    objectElements.push(objectElement)
  }

  const payload: VideoV3ProImageToVideoOut = {
    prompt: `${input.prompt}. Face from @Element1`,
    elements: [element, ...objectElements],
    negative_prompt: input.negativePrompt,
    multi_prompt: null,
    start_image_url: imageUrl,
    duration: input.duration,
    generate_audio: false,
    shot_type: ShotTypes.customize,
    aspect_ratio: input.ratio,
    cfg_scale: 0.5
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as VideoResponse;
    const resultMediaUrl = resultData.video.url;
    
    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Kling V3 Pro Image To Video: ${error}`);
    next(error);
  }
}

export const genVideoV3ProMotionControl = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as VideoV3ProMotionControlIn;
  const modelName = 'kling-video/v3/pro/motion-control';
  const userId = req.headers['x-user-id'] as string;

  const imageUrl = await getMediaUrlFromPath(input.imagePath);
  const videoUrl = await getMediaUrlFromPath(input.videoPath);
  const imageRefUrls = await Promise.all(input.imageRefPaths.map((imageRefPath: string) => getMediaUrlFromPath(imageRefPath)));

  const element: ImageElement = {
    frontal_image_url: imageRefUrls[0],
    reference_image_urls: [imageRefUrls[1], imageRefUrls[2], imageRefUrls[3]]
  }

  const payload: VideoV3ProMotionControlOut = {
    prompt: `Mimic motion with face @Element1`,
    image_url: imageUrl,
    video_url: videoUrl,
    keep_original_sound: true,
    character_orientation: CharacterOrientations.video,
    elements: [element]
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as VideoResponse;
    const resultMediaUrl = resultData.video.url;
    
    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Kling V3 Pro Motion Control: ${error}`);
    next(error);
  }
}