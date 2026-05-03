import { Request, Response, NextFunction } from 'express';
import { Job, JobStatuses } from '../types/job';
import {
  getById as getByIdDb,
  getByGroupId as getByGroupIdDb,
  getByAvatarId as getByAvatarIdDb,
  update as updateDb,
  deleteById as deleteByIdDb,
  deleteByAvatarId as deleteByAvatarIdDb,
} from '../repositories/job';
import { publishJob } from '../services/messageQueue';
import { deleteBlob } from '../services/storageService';

export const getByGroupId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const groupId = req.params.groupId as string;

  req.log.info(`Get jobs by group ID ${groupId} for user ${userId}`);

  try {
    const jobs = await getByGroupIdDb(userId, groupId);
    return res.status(201).json(jobs);
  } catch (error) {
    req.log.info(`Failed to get jobs by group ID ${groupId} for ${userId}: ${error}`);
    next(error);
  }
};

export const getByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;

  req.log.info(`Get jobs by avatar ID ${avatarId} for user ${userId}`);

  try {
    const jobs = await getByAvatarIdDb(userId, avatarId);
    return res.status(201).json(jobs);
  } catch (error) {
    req.log.info(`Failed to get jobs by avatar ID ${avatarId} for ${userId}: ${error}`);
    next(error);
  }
};

export const restart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  req.log.info(`Restart job ${id}`);

  try {
    const job: Job | null = await getByIdDb(userId, id);

    if (!job) {
      const errorMessage = `Job ${id} does not exist`;
      req.log.error(errorMessage);
      throw Error(errorMessage);
    }

    if (!job.metadata?.queueTopic) {
      const errorMessage = `Job ${id} queue topic is undefined`;
      req.log.error(errorMessage);
      throw Error(errorMessage);
    }

    job.result = { fileName: job.result?.fileName };
    job.status = JobStatuses.pending;

    await updateDb(userId, id, job, true);
    await publishJob(job.metadata.queueTopic, job);

    return res.status(200).json(job);
  } catch (error) {
    req.log.info(`Failed to restart job ${id} for user ${userId}: ${error}`);
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;
  const updateData: Partial<Job> = req.body;

  req.log.info(`Update Job for ${id} for user ${userId}`);

  try {
    const dbJob = await updateDb(userId, id, updateData);
    return res.status(200).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to update job for ${id}: ${error}`);
    next(error);
  }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  req.log.info(`Delete job ${id} for user ${userId}`);

  try {
    const job = await getByIdDb(userId, id);
    const mediaPath = job?.result?.mediaPath;

    await deleteByIdDb(userId, id);

    if (mediaPath) {
      await deleteBlob(mediaPath);
    }

    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    req.log.info(`Failed to delete job ${id} for user ${userId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;

  req.log.info(`Delete jobs for avatar ${avatarId} and user ${userId}`);

  try {
    await deleteByAvatarIdDb(userId, avatarId);
    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    req.log.info(`Failed to delete jobs for ${avatarId} and user ${userId}: ${error}`);
    next(error);
  }
};
