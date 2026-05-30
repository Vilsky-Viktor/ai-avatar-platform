import { Request, Response, NextFunction } from 'express';
import { Job, JobStatuses, WorkflowStep } from '../types/job';
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

const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';

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

    job.status = JobStatuses.pending;
    
    job.workflow.forEach((step, idx) => {
      job.workflow[idx].error = '';
      job.workflow[idx].status = JobStatuses.pending;
    })

    job.resultMediaPath = '';

    await updateDb(userId, id, job, true);
    await publishJob(WORKFLOW_MANAGER_TOPIC, job);

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
    const mediaPaths = job?.workflow
      .filter((step: WorkflowStep) => step.uploadPath)
      .map((step: WorkflowStep) => step.uploadPath);

    await deleteByIdDb(userId, id);

    if (mediaPaths && mediaPaths.length > 0) {
      await Promise.all(mediaPaths.map(path => deleteBlob(path!)))
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
