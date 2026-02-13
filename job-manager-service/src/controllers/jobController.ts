import { Request, Response, NextFunction } from 'express';
import { Job, IdPhotoJob, JobTypes, JobStatuses } from '../types/job';
import { generateIdPhotoPrompt } from '../helpers/prompts';
import { create as createDb, deleteById as deleteByIdDb, deleteByAvatarId as deleteByAvatarIdDb, deleteByUserId as deleteByUserIdDb } from '../repositories/job';
import { publishToTopic } from '../services/messageQueue';


const GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC = process.env.GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC || 'generate-text-image-to-image';


export const createIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const idPhotoJob: IdPhotoJob = req.body;

  req.log.info(`Create ID Photo Job for ${headerUserId}`);

  const job: Job = {
    userId: headerUserId as string,
    avatarId: idPhotoJob.avatarId,
    type: JobTypes.idPhoto,
    status: JobStatuses.pending,
    input: { prompt: generateIdPhotoPrompt(idPhotoJob.input) }
  }

  try {
    const jobDB = await createDb(headerUserId as string, job);

    await publishToTopic(req, GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC, jobDB)

    return res.status(201).json(jobDB);
  } catch (error) {
    req.log.info(`Failed to create ID photo job for ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteById = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { id } = req.params;

  req.log.info(`Delete job ${id} for user ${headerUserId}`);

  try {
    await deleteByIdDb(headerUserId as string, id as string);

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete job ${id} for user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByAvatarId = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { avatarId } = req.params;

  req.log.info(`Delete jobs for avatar ${avatarId} and user ${headerUserId}`);

  try {
    await deleteByAvatarIdDb(headerUserId as string, avatarId as string);

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete jobs for ${avatarId} and user ${headerUserId}: ${error}`);
    next(error);
  }
};

export const deleteByUserId = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  req.log.info(`Delete jobs for user ${userId}`);

  try {
    await deleteByUserIdDb(userId as string);

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete jobs for ${userId}: ${error}`);
    next(error);
  }
};
