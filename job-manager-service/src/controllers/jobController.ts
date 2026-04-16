import { Request, Response, NextFunction } from 'express';
import { Job, MediaTypes, JobTargets, JobStatuses, JobRequest, TrainingJobRequest } from '../types/job';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { generateTrainingPhotoSetData, genTrainingIdPhotoFromUploadedData, genTrainingIdPhotoData } from '../utils/prompts';
import { 
  getById as getByIdDb,
  create as createDb, 
  createMany as createManyDb, 
  update as updateDb,
  deleteById as deleteByIdDb, 
  deleteByAvatarId as deleteByAvatarIdDb, 
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { createPod } from '../services/runpodService';
import uuid from 'uuid';
import imageRatios from '../types/imageRatios';


const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511'


export const genTrainingIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;
  const groupId = uuid.v4();

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const squareDimensions = `${squareRatio[0]}x${squareRatio[1]}`;

  req.log.info(`Create ID photo jobs for user ${userId} with group ID ${groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {},
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${groupId}-${squareDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${groupId}-${squareDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${groupId}-${squareDimensions}.png`,
    }
  }

  try {
    const inputs = genTrainingIdPhotoData(jobRequest.parameters, idPhotoSet);
    const jobs: Job[] = [];

    const baseJob: Partial<Job> = {
      groupId,
      userId: userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    }

    for (const [idx, customItem] of inputs.entries()) {
      const newJob = {...baseJob};

      const inference = customItem.input?.inference;

      newJob.order = customItem.order;
      newJob.maxRuns = customItem.maxRuns ?? baseJob.maxRuns;
      newJob.input = customItem.input
      newJob.metadata = customItem.metadata;

      if (newJob.metadata) {
        newJob.metadata.queueTopic = GEN_QWEN_EDIT_2511_TOPIC;
      }

      newJob.result = {
        fileName: `${String(customItem.order).padStart(3, '0')}-training-photo-set-${groupId}-${inference?.width}x${inference?.height}.png`,
      }

      jobs.push(newJob as Job);
    }

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
}

export const genTrainingIdPhotosFromUploaded = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;
  const groupId = uuid.v4();

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const squareDimensions = `${squareRatio[0]}x${squareRatio[1]}`;

  req.log.info(`Create ID photo jobs for user ${userId} with group ID ${groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {
      front: `${avatarMediaPath}/uploaded/front-${squareDimensions}.png`,
      frontSmile: `${avatarMediaPath}/uploaded/smile-${squareDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/uploaded/right-${squareDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/uploaded/left-${squareDimensions}.png`,
    },
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${groupId}-${squareDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${groupId}-${squareDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${groupId}-${squareDimensions}.png`,
    }
  }

  try {
    const inputs = genTrainingIdPhotoFromUploadedData(jobRequest.parameters, idPhotoSet);
    const jobs: Job[] = [];

    const baseJob: Partial<Job> = {
      groupId,
      userId: userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    }

    for (const [idx, customItem] of inputs.entries()) {
      const newJob = {...baseJob};

      const inference = customItem.input?.inference;

      newJob.order = customItem.order;
      newJob.maxRuns = customItem.maxRuns ?? baseJob.maxRuns;
      newJob.input = customItem.input
      newJob.metadata = customItem.metadata;

      if (newJob.metadata) {
        newJob.metadata.queueTopic = GEN_QWEN_EDIT_2511_TOPIC;
      }

      newJob.result = {
        fileName: `${String(customItem.order).padStart(3, '0')}-training-photo-set-${groupId}-${inference?.width}x${inference?.height}.png`,
      }

      jobs.push(newJob as Job);
    }

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
}


export const genTrainingPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];

  const squareDimensions = `${squareRatio[0]}x${squareRatio[1]}`;
  const verticalDimensions = `${verticalRatio[0]}x${verticalRatio[1]}`;

  req.log.info(`Create Photo Set jobs for user ${userId} with group ID ${jobRequest.groupId}`);

  try {
    const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

    const idPhotoSet: IdPhotoSetPaths = {
      uploaded: {},
      generated: {
        front: `${avatarMediaPath}/001-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        frontSmile: `${avatarMediaPath}/002-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        rightQuarter: `${avatarMediaPath}/003-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        leftQuarter: `${avatarMediaPath}/004-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        rightSide: `${avatarMediaPath}/005-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        leftSide: `${avatarMediaPath}/006-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        back: `${avatarMediaPath}/007-training-photo-set-${jobRequest.groupId}-${squareDimensions}.png`,
        body: `${avatarMediaPath}/009-training-photo-set-${jobRequest.groupId}-${verticalDimensions}.png`,
      }
    }

    const inputs = generateTrainingPhotoSetData(jobRequest.parameters, idPhotoSet);
    const jobs: Job[] = [];

    const baseJob: Partial<Job> = {
      groupId: jobRequest.groupId,
      userId: userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    }

    for (const [idx, customItem] of inputs.entries()) {
      const newJob = {...baseJob};

      const inference = customItem.input?.inference;

      newJob.order = customItem.order;
      newJob.maxRuns = customItem.maxRuns ?? baseJob.maxRuns;
      newJob.input = customItem.input
      newJob.metadata = customItem.metadata;

      if (newJob.metadata) {
        newJob.metadata.queueTopic = GEN_QWEN_EDIT_2511_TOPIC;
      }

      newJob.result = {
        fileName: `${String(customItem.order).padStart(3, '0')}-training-photo-set-${jobRequest.groupId}-${inference?.width}x${inference?.height}.png`,
      }

      jobs.push(newJob as Job);
    }

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create Photo Set jobs for ${userId}: ${error}`);
    next(error);
  }

}

export const restart = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;

  req.log.info(`Restart job ${id}`);

  try {
    const job: Job | null = await getByIdDb(userId, id);

    if (!job) {
      const errorMessage = `Job ${id} does not exist`;
      req.log.error(errorMessage)
      throw Error(errorMessage)
    }

    if (!job.metadata?.queueTopic) {
      const errorMessage = `Job ${id} queue topic is undefined`;
      req.log.error(errorMessage)
      throw Error(errorMessage)
    }

    job.result = {
      fileName: job.result?.fileName!
    };

    job.status = JobStatuses.pending;

    await updateDb(userId, id, job);
    await publishJob(job.metadata.queueTopic, job);

    return res.status(200).json(job);
  } catch (error) {
    req.log.info(`Failed to restart job ${id} for user ${userId}: ${error}`);
    next(error);
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const id = req.params.id as string;
  const updateData: Partial<Job> = req.body;

  req.log.info(`Update Job for ${id} for user ${userId}`);

  try {
    const dbJob = await updateDb(userId, id, updateData);

    return res.status(201).json(dbJob);
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
    await deleteByIdDb(userId, id);

    return res.status(201).json({'result': 'ok'});
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

    return res.status(201).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete jobs for ${avatarId} and user ${userId}: ${error}`);
    next(error);
  }
};
