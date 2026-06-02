import { Request, Response, NextFunction } from 'express';
import { V2ProEditIn, V2ProEditOut } from '../types/flux';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { RatioToImageSizeMapping, OutputFormats } from '../types/image';
import { ImagesResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const genV2ProEdit = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as V2ProEditIn;
  const modelName = 'flux-2-pro/edit';

  const imageUrls = await Promise.all(input.imagePaths.map((imagePath: string) => getMediaUrlFromPath(imagePath)));

  const payload: V2ProEditOut = {
    prompt: input.prompt,
    image_urls: imageUrls,
    image_size: RatioToImageSizeMapping[input.ratio],
    output_format: OutputFormats.png,
    safety_tolerance: input.safetyTolerance,
    enable_safety_checker: false
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as ImagesResponse;
    const resultMediaUrl = resultData.images[0].url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Flux 2 Pro Edit: ${error}`);
    next(error);
  }
}