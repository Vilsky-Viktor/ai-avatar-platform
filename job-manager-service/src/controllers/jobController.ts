import { Request, Response, NextFunction } from 'express';
import { Job, MediaTypes, JobTargets, JobStatuses, JobRequest } from '../types/job';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { generateTrainingPhotoSetData } from '../utils/prompts';
import { 
  getById as getByIdDb,
  create as createDb, 
  createMany as createManyDb, 
  update as updateDb,
  deleteById as deleteByIdDb, 
  deleteByAvatarId as deleteByAvatarIdDb, 
  deleteByUserId as deleteByUserIdDb
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { createPod } from '../services/runpodService';
import uuid from 'uuid';
import imageRatios from '../types/imageRatios';


const GEN_FLUX2_DEV_TOPIC = process.env.GEN_FLUX2_DEV_TOPIC || 'gen-flux2-dev';
const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511'


export const createPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'] as string;
  const jobRequest: JobRequest = req.body;
  const groupId = uuid.v4();

  const squareRatio = imageRatios.qwenEdit2511['1:1'];
  const portraitRatio = imageRatios.qwenEdit2511['3:4'];
  const verticalRatio = imageRatios.qwenEdit2511['9:16'];

  const squareDimensions = `${squareRatio[0]}x${squareRatio[1]}`;
  const portraitDimensions = `${portraitRatio[0]}x${portraitRatio[1]}`;
  const verticalDimensions = `${verticalRatio[0]}x${verticalRatio[1]}`;

  req.log.info(`Create Photo Set jobs for user ${headerUserId} with group ID ${groupId}`);

  try {
    const avatarMediaPath = `media/${headerUserId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

    const idPhotoSet: IdPhotoSetPaths = {
      uploaded: {
        front: `${avatarMediaPath}/000-uploaded-front-${squareDimensions}.png`,
        frontSmile: `${avatarMediaPath}/000-uploaded-front-smile-${squareDimensions}.png`,
        rightQuarter: `${avatarMediaPath}/000-uploaded-right-quarter-${squareDimensions}.png`,
        leftQuarter: `${avatarMediaPath}/000-uploaded-left-quarter-${squareDimensions}.png`,
      },
      generated: {
        front: `${avatarMediaPath}/001-training-photo-set-${squareDimensions}.png`,
        frontSmile: `${avatarMediaPath}/002-training-photo-set-${squareDimensions}.png`,
        rightQuarter: `${avatarMediaPath}/003-training-photo-set-${squareDimensions}.png`,
        leftQuarter: `${avatarMediaPath}/004-training-photo-set-${squareDimensions}.png`,
        rightSide: `${avatarMediaPath}/005-training-photo-set-${squareDimensions}.png`,
        leftSide: `${avatarMediaPath}/006-training-photo-set-${squareDimensions}.png`,
        back: `${avatarMediaPath}/007-training-photo-set-${squareDimensions}.png`,
        microPortrait: `${avatarMediaPath}/008-training-photo-set-${squareDimensions}.png`,
        body: `${avatarMediaPath}/009-training-photo-set-${verticalDimensions}.png`,
      }
    }

    const inputs = generateTrainingPhotoSetData(
      {...jobRequest.input.parameters, gender: jobRequest.input.gender},
      idPhotoSet
    );
    const jobs: Job[] = [];

    const baseJob: Partial<Job> = {
      groupId,
      userId: headerUserId,
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
        fileName: `${String(customItem.order).padStart(3, '0')}-training-photo-set-${inference?.width}x${inference?.height}.png`,
      }

      jobs.push(newJob as Job);
    }

    const dbJobs = await createManyDb(headerUserId, jobs);

    // createPod(dbJobs[0]).catch(err => req.log.error("Pod creation failed:", err));

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create Photo Set jobs for ${headerUserId}: ${error}`);
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
