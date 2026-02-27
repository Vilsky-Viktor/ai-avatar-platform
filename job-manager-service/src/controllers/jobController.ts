import { Request, Response, NextFunction } from 'express';
import { Job, JobTypes, JobStatuses, JobRequest } from '../types/job';
import { generateIdPhotoView0Prompt, generateIdPhotoView45Prompt, generateIdPhotoView90Prompt, generatePhotoSetPrompts } from '../utils/prompts';
import { 
  create as createDb, 
  update as updateDb,
  deleteById as deleteByIdDb, 
  deleteByAvatarId as deleteByAvatarIdDb, 
  deleteByUserId as deleteByUserIdDb
} from '../repositories/job';
import { publishToTopic } from '../services/messageQueue';
import { createPod } from '../services/runpodService';
import uuid from 'uuid';


const GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC = process.env.GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC || 'generate-text-image-to-image';
const ID_PHOTO_WIDTH = 1024;
const ID_PHOTO_HEIGHT = 1024;
const ID_PHOTO_GUIDANCE = 1.0;
const ID_PHOTO_NUM_STEPS = 15


export const createIdPhotoView0 = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const jobRequest: JobRequest = req.body;
  const groupId = uuid.v4();

  req.log.info(`Create ID Photo view 0 job for ${headerUserId}`);

  const job: Job = {
    groupId,
    order: 0,
    userId: headerUserId as string,
    avatarId: jobRequest.avatarId,
    type: JobTypes.idPhoto,
    status: JobStatuses.pending,
    numRuns: 0,
    input: { 
      prompt: generateIdPhotoView0Prompt({...jobRequest.input.parameters, gender: jobRequest.input.gender}), 
      imagePaths: [],
      idPhotoPaths: [],
      width: ID_PHOTO_WIDTH, 
      height: ID_PHOTO_HEIGHT, 
      guidance: ID_PHOTO_GUIDANCE, 
      numSteps: ID_PHOTO_NUM_STEPS,
      maxRuns: 5,
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create ID photo view 0 job for ${headerUserId}: ${error}`);
    next(error);
  }
};

export const createIdPhotoView45 = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const jobRequest: JobRequest = req.body;

  req.log.info(`Create ID Photo view 45 job for ${headerUserId}`);

  const job: Job = {
    groupId: jobRequest.groupId,
    order: 1,
    userId: headerUserId as string,
    avatarId: jobRequest.avatarId,
    type: JobTypes.idPhoto,
    status: JobStatuses.pending,
    numRuns: 0,
    input: { 
      prompt: generateIdPhotoView45Prompt({...jobRequest.input.parameters, gender: jobRequest.input.gender}), 
      imagePaths: jobRequest.input.idPhotoPaths,
      idPhotoPaths: jobRequest.input.idPhotoPaths,
      width: ID_PHOTO_WIDTH, 
      height: ID_PHOTO_HEIGHT, 
      guidance: ID_PHOTO_GUIDANCE, 
      numSteps: ID_PHOTO_NUM_STEPS,
      maxRuns: 5,
      similarityThreshold: 0.8
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create ID photo view 45 job for ${headerUserId}: ${error}`);
    next(error);
  }
};

export const createIdPhotoView90 = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const jobRequest: JobRequest = req.body;

  req.log.info(`Create ID Photo view 90 job for ${headerUserId}`);

  const job: Job = {
    groupId: jobRequest.groupId,
    order: 2,
    userId: headerUserId as string,
    avatarId: jobRequest.avatarId,
    type: JobTypes.idPhoto,
    status: JobStatuses.pending,
    numRuns: 0,
    input: { 
      prompt: generateIdPhotoView90Prompt({...jobRequest.input.parameters, gender: jobRequest.input.gender}), 
      imagePaths: jobRequest.input.idPhotoPaths,
      idPhotoPaths: jobRequest.input.idPhotoPaths,
      width: ID_PHOTO_WIDTH, 
      height: ID_PHOTO_HEIGHT, 
      guidance: ID_PHOTO_GUIDANCE, 
      numSteps: ID_PHOTO_NUM_STEPS,
      maxRuns: 5,
      similarityThreshold: 0.8
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create ID photo view 90 job for ${headerUserId}: ${error}`);
    next(error);
  }
};

export const createPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const jobRequest: JobRequest = req.body;
  const groupId = uuid.v4();

  req.log.info(`Create Photo Set jobs for user ${headerUserId} with group ID ${groupId}`);

  try {
    const prompts = generatePhotoSetPrompts({...jobRequest.input.parameters, gender: jobRequest.input.gender});
    let index = 0;
    const jobs: Job[] = [];

    const baseJob: Job = {
      groupId,
      userId: headerUserId as string,
      avatarId: jobRequest.avatarId,
      order: 0,
      type: JobTypes.photoSet,
      status: JobStatuses.pending,
      numRuns: 0,
      input: {
        prompt: '',
        imagePaths: jobRequest.input.idPhotoPaths,
        idPhotoPaths: jobRequest.input.idPhotoPaths?.slice(0,3),
        width: 1024, 
        height: 1024, 
        guidance: 1.0, 
        numSteps: 13,
        maxRuns: 5,
        similarityThreshold: 0.75
      }
    }

    for (const [idx, prompt] of prompts.entries()) {
      const newJob = {...baseJob};

      newJob.order = idx;
      newJob.input = {
        ...baseJob.input,
        prompt,
      }

      jobs.push(newJob);

      index++;
    }

    const dbJobs = await Promise.all(jobs.map((job: Job) => createDb(headerUserId as string, job)));

    // createPod(dbJobs[0]).catch(err => req.log.error("Pod creation failed:", err));

    await Promise.all(dbJobs.map((dbJob: Job) => publishToTopic(GENERAGE_TEXT_IMAGE_TO_IMAGE_TOPIC, dbJob)));

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create Photo Set jobs for ${headerUserId}: ${error}`);
    next(error);
  }

}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const { id } = req.params;
  const updateData: Partial<Job> = req.body;

  req.log.info(`Update Job for ${id} for user ${headerUserId}`);

  try {
    const dbJob = await updateDb(headerUserId as string, id as string, updateData);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to update job for ${id}: ${error}`);
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
