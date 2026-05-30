import { Request, Response, NextFunction } from 'express';
import { ImageModels, SubjectDetections, UpscaleImageIn, UpscaleImageOut, UpscaleVideoIn, UpscaleVideoOut, VideoModels } from '../types/topaz';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { OutputFormats } from '../types/image';
import { VideoResponse, ImageResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const upscaleImage = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as UpscaleImageIn;
  const modelName = 'topaz/upscale/image';

  const imageUrl = await getMediaUrlFromPath(input.imagePath);

  const payload: UpscaleImageOut = {
    model: ImageModels.standardV2,
    upscale_factor: 2,
    image_url: imageUrl,
    output_format: OutputFormats.png,
    subject_detection: SubjectDetections.all,
    face_enhancement: true,
    face_enhancement_strength: 0.8
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImageResponse;
    const resultMediaUrl = resultData.image.url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to upscale with Topaz Image: ${error}`);
    next(error);
  }
}

export const upscaleVideo = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as UpscaleVideoIn;
  const modelName = 'topaz/upscale/video';

  const videoUrl = await getMediaUrlFromPath(input.videoPath);

  const payload: UpscaleVideoOut = {
      video_url: videoUrl,
      model: VideoModels.proteus,
      upscale_factor: 2
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as VideoResponse;
    const resultMediaUrl = resultData.video.url;
    
    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to upscale with Topaz Video: ${error}`);
    next(error);
  }

}