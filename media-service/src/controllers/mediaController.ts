import { Request, Response, NextFunction } from 'express';
import { type Media, MediaSection, MediaType } from '../types/media';
import { create as createDb } from '../repositories/media';
import { updateCounter } from '../services/avatarService';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const media: Media = req.body;

  req.log.info(`Create media for job ${media.jobId} for user ${headerUserId}`);

  try {
    const mediaDB = await createDb(headerUserId as string, media);

    if (media.section === MediaSection.avatar) {
      const counterFieldName = media.type === MediaType.image ? 'imageCount' : 'videoCount';
      await updateCounter(headerUserId as string, media.avatarId, counterFieldName, 1);
    }

    return res.status(201).json(mediaDB);
  } catch (error) {
    req.log.info(`Failed to create media for job ${media.jobId} for user ${headerUserId}: ${error}`);
    next(error);
  }
};