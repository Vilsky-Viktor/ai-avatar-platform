import { Request, Response, NextFunction } from 'express';
import { Job, JobTypes, JobStatuses, JobRequest } from '../types/job';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { generateIdPhotoView0Prompt, generateIdPhotoView45Prompt, generateIdPhotoView90Prompt, generatePhotoSetInputs } from '../utils/prompts';
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
import imageRatios from '../types/imageRatios';


const GEN_FLUX2_DEV_TOPIC = process.env.GEN_FLUX2_DEV_TOPIC || 'gen-flux2-dev';
const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511'
const ID_PHOTO_WIDTH = 1328;
const ID_PHOTO_HEIGHT = 1328;
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
      checkDependencyImageExistence: false,
      inference: {
        imagePaths: [],
        idPhotoPaths: [],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 1, numInferenceSteps: ID_PHOTO_NUM_STEPS, width: ID_PHOTO_WIDTH, height: ID_PHOTO_HEIGHT },
        ],
      },
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GEN_FLUX2_DEV_TOPIC, dbJob);

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
      checkDependencyImageExistence: true,
      inference: {
        imagePaths: jobRequest.input.idPhotoPaths ?? [],
        idPhotoPaths: jobRequest.input.idPhotoPaths ?? [],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 1, numInferenceSteps: ID_PHOTO_NUM_STEPS, width: ID_PHOTO_WIDTH, height: ID_PHOTO_HEIGHT },
        ],
      },
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GEN_FLUX2_DEV_TOPIC, dbJob);

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
      checkDependencyImageExistence: true,
      inference: {
        imagePaths: jobRequest.input.idPhotoPaths ?? [],
        idPhotoPaths: jobRequest.input.idPhotoPaths ?? [],
        trueCfgScale: 1.0,
        inferenceLevels: [
          { numRuns: 1, numInferenceSteps: ID_PHOTO_NUM_STEPS, width: ID_PHOTO_WIDTH, height: ID_PHOTO_HEIGHT },
        ],
      },
    }
  }

  try {
    const dbJob = await createDb(headerUserId as string, job);

    createPod(dbJob).catch(err => req.log.error("Pod creation failed:", err));

    await publishToTopic(GEN_FLUX2_DEV_TOPIC, dbJob);

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
      microPortrait: `${avatarMediaPath}/001-training-photo-set-${squareDimensions}-${groupId}.png`,
      front: `${avatarMediaPath}/000-uploaded-front-${squareDimensions}.png`,
      frontSmile: `${avatarMediaPath}/000-uploaded-front-smile-${squareDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/000-uploaded-right-quarter-${squareDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/000-uploaded-left-quarter-${squareDimensions}.png`,
      rightSide: `${avatarMediaPath}/006-training-photo-set-${squareDimensions}-${groupId}.png`,
      leftSide: `${avatarMediaPath}/007-training-photo-set-${squareDimensions}-${groupId}.png`,
      body: `${avatarMediaPath}/008-training-photo-set-${verticalDimensions}-${groupId}.png`,
    }

    const inputs = generatePhotoSetInputs(
      headerUserId as string, 
      jobRequest.avatarId, 
      {...jobRequest.input.parameters, gender: jobRequest.input.gender},
      idPhotoSet
    );
    const jobs: Job[] = [];

    const baseJob: Job = {
      groupId,
      userId: headerUserId as string,
      avatarId: jobRequest.avatarId,
      type: JobTypes.photoSet,
      status: JobStatuses.pending,
      numRuns: 0,
      input: {
        checkDependencyImageExistence: true,
        faceSwap: { enabled: false },
        faceEnhancement: { enabled: false },
        controlnet: { enabled: false }
      }
    }

    for (const [idx, input] of inputs.entries()) {
      const newJob = {...baseJob};

      const lastInferenceLevel = (input.inference?.inferenceLevels.length || 1) - 1;
      const width = input.inference?.inferenceLevels[lastInferenceLevel].width;
      const height = input.inference?.inferenceLevels[lastInferenceLevel].height;

      newJob.order = input.order;
      newJob.input = {
        ...baseJob.input,
        ...input,
        resultFileName: `${String(input.order).padStart(3, '0')}-training-photo-set-${width}x${height}-${groupId}.png`,
      }

      jobs.push(newJob);
    }

    const dbJobs = await Promise.all(jobs.map((job: Job) => createDb(headerUserId as string, job)));

    // createPod(dbJobs[0]).catch(err => req.log.error("Pod creation failed:", err));

    await Promise.all(dbJobs.map((dbJob: Job) => publishToTopic(GEN_QWEN_EDIT_2511_TOPIC, dbJob)));

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
