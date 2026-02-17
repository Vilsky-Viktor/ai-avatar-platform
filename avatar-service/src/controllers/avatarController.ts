import { Request, Response, NextFunction } from 'express';
import { Avatar } from '../types/avatar';
import { create as createDb, update as updateDb, deleteByAvatarId as deleteByAvatarIdDb, deleteByUserId as deleteByUserIdDb, getAll as getAllDb } from '../repositories/avatar';
import { AvatarStatus } from '../types/avatar';
import { deleteJobsByAvatarId, deleteJobsByUserId } from '../services/jobService';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];

  req.log.info(`Get all avatars for user ${headerUserId}`);

  try {
    const avatarsDB = await getAllDb(headerUserId as string);

    return res.status(201).json(avatarsDB);
  } catch (error) {
    req.log.info(`Failed to get all avatars for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const avatar: Avatar = req.body;

  req.log.info(`Create avatar ${avatar.name} for user ${headerUserId}`);

  try {
    avatar.status = AvatarStatus.initialized;
    avatar.imageCount = 0;
    avatar.videoCount = 0;
    const avatarDB = await createDb(headerUserId as string, avatar);

    return res.status(201).json(avatarDB);
  } catch (error) {
    req.log.info(`Failed to create avatar ${avatar.name} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const avatarData: Partial<Avatar> = req.body;
  const { id } = req.params;

  req.log.info(`Update avatar ${id} for user ${headerUserId}`);

  try {
    const avatarDB = await updateDb(headerUserId as string, id as string, avatarData);

    return res.status(201).json(avatarDB);
  } catch (error) {
    req.log.info(`Failed to update avatar ${id} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { id } = req.params;

  req.log.info(`Delete avatar ${id} for user ${headerUserId}`);

  try {
    await deleteByAvatarIdDb(headerUserId as string, id as string);
    await deleteJobsByAvatarId(req, headerUserId as string, id as string);

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete avatar ${id} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByUserId = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  req.log.info(`Delete avatars for user ${userId}`);

  try {
    await deleteByUserIdDb(userId as string);
    await deleteJobsByUserId(req, userId as string);

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete avatars for user ${userId}: ${error}`);
    next(error);
  }
};