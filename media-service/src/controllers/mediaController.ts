import { Request, Response, NextFunction } from 'express';
import { Media } from '../types/media';
import { create as createDb } from '../repositories/media';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const media: Media = req.body;

  req.log.info(`Create media for job ${media.jobId} for user ${headerUserId}`);

  try {
    const mediaDB = await createDb(headerUserId as string, media);

    return res.status(201).json(mediaDB);
  } catch (error) {
    req.log.info(`Failed to create media for job ${media.jobId} for user ${headerUserId}: ${error}`);
    next(error);
  }
};