import { Request, Response, NextFunction } from 'express';
import { UpsampleRequest } from '../types/requestPayloads';
import { downloadFiles } from "../services/storage";
import { imagesToBase64, getMimeType } from "../utils/files";
import { ImageData } from '../types/images';
import { sendLlmRequest } from '../services/openrouter';

export const getPersonCharacteristics = async (req: Request, res: Response, next: NextFunction) => {
  const upsampleRequest: UpsampleRequest = req.body;

  req.log.info(`Get person characteristics`);

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

    const prompt = 'Analyze face characteristics and return only valid JSON';
    const model = 'qwen/qwen3.5-plus-02-15';

    const response = await sendLlmRequest(prompt, imageData, model, 'personCharacteristics');

    const numCharacters = response?.length;
    const numWords = response.split(' ').length;

    const jsonResponse = JSON.parse(response);
    return res.status(201).json({response: jsonResponse, numCharacters, numWords});
  } catch (error) {
    req.log.info(`Failed to send LLM request to get person characteristics: ${error}`);
    next(error);
  }
};

