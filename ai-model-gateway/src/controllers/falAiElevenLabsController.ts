import { Request, Response, NextFunction } from 'express';
import { TextNormalizations, TtsElevenV3In, TtsElevenV3Out } from '../types/elevenLabs';
import falAi from '../services/falAi';
import { AudioResponse } from '../types/falAi';
import { downloadResultFile, uploadToBucket } from '../services/storage';

export const genTtsElevenV3 = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as TtsElevenV3In;
  const modelName = 'elevenlabs/tts/eleven-v3';
  const userId = req.headers['x-user-id'] as string;

  const payload: TtsElevenV3Out = {
    text: input.text,
    voice: input.voice,
    stability: 0.5,
    language_code: input.language,
    apply_text_normalization: TextNormalizations.auto
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as AudioResponse;
    const resultMediaUrl = resultData.audio.url;

    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with ElevenLabs Eleven V3: ${error}`);
    next(error);
  }
}