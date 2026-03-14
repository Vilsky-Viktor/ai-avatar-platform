import { Request, Response, NextFunction } from 'express';
import { UpsampleRequest } from '../types/requestPayloads';
import { downloadFiles } from "../services/storage";
import { imagesToBase64, getMimeType } from "../utils/files";
import { ImageData } from '../types/images';
import { upsample } from '../services/openrouter';

export const upsamplePrompt = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const upsampleRequest: UpsampleRequest = req.body;

  req.log.info(`Upsample prompt with model ${upsampleRequest.promptModel} for ${upsampleRequest.targetModel}`);

  try {
    
    const imageData: ImageData[] = [];

    const images = await downloadFiles(upsampleRequest.imagePaths);
    const encodedImages = imagesToBase64(images);

    for (const [idx, encodedImage] of encodedImages.entries()) {
      imageData.push({
        image: encodedImage,
        mimeType: getMimeType(upsampleRequest.imagePaths[idx]),
      })
    }

    const upsampledPrompt = await upsample(upsampleRequest.prompt, imageData, upsampleRequest.promptModel, upsampleRequest.targetModel, upsampleRequest.action);
    const numCharacters = upsampledPrompt?.length;
    const numWords = upsampledPrompt.split(' ').length;

    return res.status(201).json({prompt: upsampledPrompt, numCharacters, numWords});
  } catch (error) {
    req.log.info(`Failed to upsample prompt with model ${upsampleRequest.promptModel} for ${upsampleRequest.targetModel}`);
    next(error);
  }
};

