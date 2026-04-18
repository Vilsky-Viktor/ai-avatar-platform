import { Request, Response, NextFunction } from 'express';
import { type Media, MediaSection, MediaType } from '../types/media';
import { create as createDb, deleteById as deleteByIdDb, deleteByAvatarId as deleteByAvatarIdDb, deleteByUserId as deleteByUserIdDb } from '../repositories/media';
import { updateCounterByFieldName } from '../services/avatarService';
import { removeStoredMediaByPaths } from '../services/storage';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const media: Media = req.body;

  req.log.info(`Create media for job ${media.jobId} for user ${headerUserId}`);

  try {
    const mediaDB = await createDb(headerUserId as string, media);

    if (media.section === MediaSection.avatar) {
      const counterFieldName = media.type === MediaType.image ? 'imageCount' : 'videoCount';
      await updateCounterByFieldName(headerUserId as string, media.avatarId, counterFieldName, 1);
    }

    return res.status(201).json(mediaDB);
  } catch (error) {
    req.log.info(`Failed to create media for job ${media.jobId} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { id } = req.params;

  req.log.info(`Delete media ${id} for user ${headerUserId}`);

  try {
    const removedMedia = await deleteByIdDb(headerUserId as string, id as string);

    if (removedMedia) {
      const counterFieldName = removedMedia.type === MediaType.image ? 'imageCount' : 'videoCount';
      await Promise.all([
        updateCounterByFieldName(headerUserId as string, removedMedia.avatarId, counterFieldName, -1),
        removeStoredMediaByPaths([removedMedia.path])
      ])
    }

    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete media ${id} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { avatarId } = req.params;

  req.log.info(`Delete media for avatar ${avatarId} and user ${headerUserId}`);

  try {
    const removedMedia = await deleteByAvatarIdDb(headerUserId as string, avatarId as string);

    if (removedMedia.length > 0) {
      let imageIncrement = 0;
      let videoIncrement = 0;

      for (const media of removedMedia) {
        media.type === MediaType.image ? imageIncrement-- : videoIncrement--;
      }

      const avatarMediaPath = `media/${headerUserId}-user/avatars/${removedMedia[0].avatarId}-avatar/`;

      await Promise.all([
        updateCounterByFieldName(headerUserId as string, removedMedia[0].avatarId, 'imageCount', imageIncrement),
        updateCounterByFieldName(headerUserId as string, removedMedia[0].avatarId, 'videoCount', videoIncrement),
        removeStoredMediaByPaths([avatarMediaPath])
      ])
    }

    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete media for ${avatarId} and user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByUserId = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  req.log.info(`Delete media for user ${userId}`);

  try {
    const removedMedia = await deleteByUserIdDb(userId as string);

    if (removedMedia.length > 0) {

      const removedMediaByAvatarId = new Map<string, Media[]>();

      for (const media of removedMedia) {
        const existing = removedMediaByAvatarId.get(media.avatarId) || [];
        existing.push(media);
        removedMediaByAvatarId.set(media.avatarId, existing);
      }

      for (const [avatarId, mediaList] of removedMediaByAvatarId) {
        let imageIncrement = 0;
        let videoIncrement = 0;

        const avatarMediaPath = `media/${userId}-user/avatars/${avatarId}-avatar/`;

        for (const media of mediaList) {
          media.type === MediaType.image ? imageIncrement-- : videoIncrement--;
        }

        await Promise.all([
          updateCounterByFieldName(userId as string, avatarId, 'imageCount', imageIncrement),
          updateCounterByFieldName(userId as string, avatarId, 'videoCount', videoIncrement),
          removeStoredMediaByPaths([avatarMediaPath])
        ])
      }
    }

    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete media for ${userId}: ${error}`);
    next(error);
  }
};