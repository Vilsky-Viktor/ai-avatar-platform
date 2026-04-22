import { Request, Response, NextFunction } from 'express';
import { type Media, MediaSection } from '../types/media';
import { create as createDb, createMany as createManyDb, getByAvatarId as getByAvatarIdDb, deleteById as deleteByIdDb, deleteByAvatarId as deleteByAvatarIdDb } from '../repositories/media';
import { getJobsByGroupId } from '../services/jobManagerService';
import { removeStoredMediaByPaths } from '../services/storage';
import { InferenceJob } from '../types/job';

export const getByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.id as string;

  try {
    const media = await getByAvatarIdDb(userId, avatarId);
    return res.status(200).json(media);
  } catch (error) {
    req.log.info(`Failed to get media for avatar ${avatarId} for user ${userId}: ${error}`);
    next(error);
  }
};

export const createFromJob = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const job: InferenceJob = req.body;

  const media = {
    userId,
    avatarId: job.avatarId,
    jobId: job.id,
    groupId: job.groupId,
    type: job.mediaType,
    section: MediaSection.avatar,
    isRemovable: true,
    isIdPhoto: false,
    isPhotoSet: false,
    path: job.result?.mediaPath,
    dimensions: job.metadata?.dimensions,
    ratio: job.metadata?.ratio,
    upscaled: false,
  } as Media;

  try {
    const created = await createDb(userId, media);
    return res.status(201).json(created);
  } catch (error) {
    req.log.info(`Failed to create training media for job ${job.id} for user ${userId}: ${error}`);
    next(error);
  }
}

export const createTrainingMedia = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const groupId = req.params.groupId as string;

  try {
    const jobs = await getJobsByGroupId(userId, groupId);

    const mediaList = jobs.map(job => ({
      userId,
      avatarId: job.avatarId,
      jobId: job.id,
      groupId: job.groupId,
      type: job.mediaType,
      section: MediaSection.avatar,
      isRemovable: false,
      isIdPhoto: job.order! < 10,
      isPhotoSet: job.order! > 9,
      path: job.result?.mediaPath,
      dimensions: job.metadata?.dimensions,
      ratio: job.metadata?.ratio,
      angle: job.metadata?.angle,
      shotType: job.metadata?.shotType,
      upscaled: false,
      order: job.order,
    } as Omit<Media, 'id'>));

    const created = await createManyDb(userId, mediaList);
    return res.status(201).json(created);
  } catch (error) {
    req.log.info(`Failed to create training media for job group ID ${groupId} for user ${userId}: ${error}`);
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const media: Media = req.body;

  try {
    const created = await createDb(userId, media);
    return res.status(201).json(created);
  } catch (error) {
    req.log.info(`Failed to create media for job ${media.jobId} for user ${userId}: ${error}`);
    next(error);
  }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  try {
    const removed = await deleteByIdDb(userId, id);
    if (removed) await removeStoredMediaByPaths([removed.path]);
    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    req.log.info(`Failed to delete media ${id} for user ${userId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;

  try {
    await deleteByAvatarIdDb(userId, avatarId);

    const avatarMediaPath = `media/${userId}-user/avatars/${avatarId}-avatar/`;
    await removeStoredMediaByPaths([avatarMediaPath]);

    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    req.log.info(`Failed to delete media for avatar ${avatarId} for user ${userId}: ${error}`);
    next(error);
  }
};
