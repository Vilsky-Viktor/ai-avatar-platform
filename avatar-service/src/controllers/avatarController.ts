import { Request, Response, NextFunction } from 'express';
import { Avatar } from '../types/avatar';
import { 
  create as createDb, 
  update as updateDb,
  deleteByAvatarId as deleteByAvatarIdDb, 
  getAll as getAllDb 
} from '../repositories/avatar';
import { deleteJobsByAvatarId, deleteJobsByUserId } from '../services/jobService';
import { deleteMediaByAvatarId } from '../services/mediaService';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];

  req.log.info(`Get all avatars for user ${headerUserId}`);

  try {
    const avatarsDB = await getAllDb(headerUserId as string);

    return res.status(200).json(avatarsDB);
  } catch (error) {
    req.log.info(`Failed to get all avatars for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatar: Avatar = req.body;

  req.log.info(`Create avatar ${avatar.name} for user ${userId}`);

  try {
    const avatarDB = await createDb(userId, avatar);

    return res.status(201).json(avatarDB);
  } catch (error) {
    req.log.info(`Failed to create avatar ${avatar.name} for user ${userId}: ${error}`);
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'] as string;
  const avatarData: Partial<Avatar> = req.body;
  const id = req.params.id as string;

  req.log.info(`Update avatar ${id} for user ${headerUserId}`);

  try {
    const avatarDB = await updateDb(headerUserId, id, avatarData);

    return res.status(200).json(avatarDB);
  } catch (error) {
    req.log.info(`Failed to update avatar ${id} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  req.log.info(`Delete avatar ${id} for user ${userId}`);

  try {
    await Promise.all([
      deleteJobsByAvatarId(userId, id),
      deleteMediaByAvatarId(userId, id)
    ]);

    await deleteByAvatarIdDb(userId, id);
    
    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete avatar ${id} for user ${userId}: ${error}`);
    next(error);
  }
};
