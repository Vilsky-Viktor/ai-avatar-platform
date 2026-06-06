import { Request, Response, NextFunction } from 'express';
import { Job, WorkflowStep } from '@loom24/shared/types';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import {
  getById as getByIdDb,
  getByGroupId as getByGroupIdDb,
  getByAvatarId as getByAvatarIdDb,
  getCountsByAvatarId as getCountsByAvatarIdDb,
  update as updateDb,
  deleteById as deleteByIdDb,
  deleteByAvatarId as deleteByAvatarIdDb,
} from '../repositories/job';
import { sendJob } from '@loom24/shared/services';
import { deleteBlob } from '../services/storageService';

const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  setLogContext(userId, undefined, id);
  try {
    logger.info('Get job by ID');
    const job = await getByIdDb(userId, id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.status(200).json(job);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get job by ID');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const getByGroupId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const groupId = req.params.groupId as string;

  setLogContext(userId);
  try {
    logger.info({ groupId }, 'Get jobs by group ID');
    const jobs = await getByGroupIdDb(userId, groupId);
    return res.status(200).json(jobs);
  } catch (error) {
    logger.error({ groupId, err: error }, 'Failed to get jobs by group ID');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const getByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;
  const cursor = req.query.cursor as string | undefined;

  setLogContext(userId, avatarId);
  try {
    logger.info('Get jobs by avatar ID');
    const result = await getByAvatarIdDb(userId, avatarId, cursor);
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get jobs by avatar ID');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const getCountsByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;

  setLogContext(userId, avatarId);
  try {
    logger.info('Get job counts by avatar ID');
    const counts = await getCountsByAvatarIdDb(userId, avatarId);
    return res.status(200).json(counts);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get job counts by avatar ID');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const restart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  setLogContext(userId, undefined, id);
  try {
    logger.info('Restart job');
    const job: Job | null = await getByIdDb(userId, id);

    if (!job) {
      logger.error('Job not found for restart');
      throw Object.assign(new Error(`Job ${id} does not exist`), { status: 404 });
    }

    job.status = 'pending' as any;

    job.workflow.forEach((_, idx) => {
      job.workflow[idx].error = '';
      job.workflow[idx].status = 'pending' as any;
    });

    await updateDb(userId, id, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, job, 'job-manager');

    return res.status(200).json(job);
  } catch (error) {
    logger.error({ err: error }, 'Failed to restart job');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;
  const updateData: Partial<Job> = req.body;

  setLogContext(userId, undefined, id);
  try {
    logger.info('Update job');
    const dbJob = await updateDb(userId, id, updateData);
    return res.status(200).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update job');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  setLogContext(userId, undefined, id);
  try {
    logger.info('Delete job');
    const job = await getByIdDb(userId, id);
    const mediaPaths = job?.workflow
      .filter((step: WorkflowStep) => step.uploadPath)
      .map((step: WorkflowStep) => step.uploadPath);

    await deleteByIdDb(userId, id);

    if (mediaPaths && mediaPaths.length > 0) {
      await Promise.all(mediaPaths.map(path => deleteBlob(path!)));
    }

    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete job');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const avatarId = req.params.avatarId as string;

  setLogContext(userId, avatarId);
  try {
    logger.info('Delete jobs by avatar ID');
    await deleteByAvatarIdDb(userId, avatarId);
    return res.status(200).json({ result: 'ok' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete jobs by avatar ID');
    next(error);
  } finally {
    clearLogContext();
  }
};
