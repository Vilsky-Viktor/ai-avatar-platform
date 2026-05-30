import { Request, Response, NextFunction } from 'express';
import { UpscaleImageIn, UpscaleImageOut, UpscaleModes } from '../types/seedvr';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { OutputFormats } from '../types/image';
import { ImageResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const upscaleImage = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as UpscaleImageIn;
  const modelName = 'seedvr/upscale/image';

  const imageUrl = await getMediaUrlFromPath(input.imagePath);

  const payload: UpscaleImageOut = {
    image_url: imageUrl,
    upscale_mode: UpscaleModes.factor,
    upscale_factor: 2,
    noise_scale: 0.1,
    output_format: OutputFormats.png
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImageResponse;
    const resultMediaUrl = resultData.image.url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to upscale with Seedvr Image: ${error}`);
    next(error);
  }
}