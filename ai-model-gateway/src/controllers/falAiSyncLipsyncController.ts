import { Request, Response, NextFunction } from 'express';
import { getMediaUrlFromPath, downloadResultFile, uploadToBucket } from '../services/storage';
import { SyncModes, v3In, v3Out } from '../types/syncLipsync';
import { VideoResponse } from '../types/falAi';
import falAi from '../services/falAi';

export const genV3 = async (req: Request, res: Response, next: NextFunction) => {
  const input = req.body as v3In;
  const modelName = 'sync-lipsync/v3';

  const videoUrl = await getMediaUrlFromPath(input.videoPath);
  const audioUrl = await getMediaUrlFromPath(input.audioPath);

  const payload: v3Out = {
    video_url: videoUrl,
    audio_url: audioUrl,
    sync_mode: SyncModes.cutOff,
  }

  try {
    const result = await falAi.sendRequest(modelName, payload);
    const resultData = result.data as VideoResponse;
    const resultMediaUrl = resultData.video.url;
    
    const mediaBlob = await downloadResultFile(resultMediaUrl);
    await uploadToBucket(mediaBlob, input.uploadPath);

    return res.status(200).json({ mediaPath: input.uploadPath });
  } catch (error: any) {
    req.log.info(`Failed to generate with Sync Lipsync: ${error}`);
    next(error);
  }
}