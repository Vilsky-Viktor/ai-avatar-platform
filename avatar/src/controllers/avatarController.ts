import { Request, Response, NextFunction } from 'express';
import { Avatar } from '@loom24/shared/types';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import {
  create as createDb,
  update as updateDb,
  deleteByAvatarId as deleteByAvatarIdDb,
  getAll as getAllDb,
  getById as getByIdDb,
  getBySlug as getBySlugDb,
} from '../repositories/avatar';
import { deleteJobsByAvatarId } from '../services/jobService';
import { removeAvatarMediaFolder } from '../services/storage';

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.id as string;

  setLogContext(userId, avatarId);
  try {
    logger.info('Get avatar by ID');
    const avatarDB = await getByIdDb(userId, avatarId);
    return res.status(200).json(avatarDB);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get avatar by ID');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const getBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarSlug = req.params.slug as string;

  setLogContext(userId);
  try {
    logger.info({ avatarSlug }, 'Get avatar by slug');
    const avatarDB = await getBySlugDb(userId, avatarSlug);
    return res.status(200).json(avatarDB);
  } catch (error) {
    logger.error({ avatarSlug, err: error }, 'Failed to get avatar by slug');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;

  setLogContext(userId);
  try {
    logger.info('Get all avatars');
    const avatarsDB = await getAllDb(userId);
    return res.status(200).json(avatarsDB);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get all avatars');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatar: Avatar = req.body;

  setLogContext(userId);
  try {
    logger.info({ avatarName: avatar.name }, 'Create avatar');
    const avatarDB = await createDb(userId, avatar);
    return res.status(201).json(avatarDB);
  } catch (error) {
    logger.error({ avatarName: avatar.name, err: error }, 'Failed to create avatar');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'] as string;
  const avatarData: Partial<Avatar> = req.body;
  const id = req.params.id as string;

  setLogContext(headerUserId, id);
  try {
    logger.info('Update avatar');
    const avatarDB = await updateDb(headerUserId, id, avatarData);
    return res.status(200).json(avatarDB);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update avatar');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  setLogContext(userId, id);
  try {
    logger.info('Delete avatar');
    await Promise.all([
      deleteByAvatarIdDb(userId, id),
      deleteJobsByAvatarId(userId, id),
      removeAvatarMediaFolder(userId, id)
    ]);

    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete avatar');
    next(error);
  } finally {
    clearLogContext();
  }
};
