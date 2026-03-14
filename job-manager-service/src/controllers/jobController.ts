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
import { upsample } from '../services/promptUpsamplerService';
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
      checkDependencyImageExistance: false,
      upsamplePromptMode: "local"
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
      similarityThreshold: 0.8,
      checkDependencyImageExistance: true,
      upsamplePromptMode: "local"
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
      similarityThreshold: 0.8,
      checkDependencyImageExistance: true,
      upsamplePromptMode: "local"
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
  const imageWidth = 1024;
  const imageHeight = 1024;

  req.log.info(`Create Photo Set jobs for user ${headerUserId} with group ID ${groupId}`);

  try {
    const dimensionSuffix = `${imageWidth}x${imageHeight}`;
    const avatarMediaPath = `media/${headerUserId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

    const idPhotoSet: IdPhotoSetPaths = {
      front: `${avatarMediaPath}/000-uploaded-front-${dimensionSuffix}.png`,
      frontSmile: `${avatarMediaPath}/000-uploaded-front-smile-${dimensionSuffix}.png`,
      rightQuarter: `${avatarMediaPath}/000-uploaded-right-quarter-${dimensionSuffix}.png`,
      leftQuarter: `${avatarMediaPath}/000-uploaded-left-quarter-${dimensionSuffix}.png`,
      rightSide: `${avatarMediaPath}/005-training-photo-set-${dimensionSuffix}-final.png`,
      leftSide: `${avatarMediaPath}/006-training-photo-set-${dimensionSuffix}-final.png`,
      bodyFront: `${avatarMediaPath}/007-training-photo-set-${dimensionSuffix}-final.png`,
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
        width: imageWidth, 
        height: imageHeight, 
        guidance: 4.0, 
        numSteps: 50,
        maxRuns: 3,
        similarityThreshold: 0.8,
        checkDependencyImageExistance: true,
        upsamplePromptMode: 'none',
        idPhotoPaths: [idPhotoSet.front, idPhotoSet.frontSmile, idPhotoSet.rightQuarter, idPhotoSet.leftQuarter, idPhotoSet.rightSide, idPhotoSet.leftSide],
      }
    }

    for (const [idx, input] of inputs.entries()) {
      const newJob = {...baseJob};

      // const upsampled = await upsample(input.prompt, input.imagePaths, 'qwen/qwen3.5-plus-02-15', 'flux.2-dev', 'descPerson')
      // req.log.info(`Upsampled prompt: ${JSON.stringify(upsampled)}`);

      newJob.order = input.order;
      newJob.input = {
        ...baseJob.input,
        prompt: input.prompt,
        imagePaths: input.imagePaths,
        idPhotoPaths: input.idPhotoPaths ?? baseJob.input.idPhotoPaths,
        numSteps: input.numSteps ?? baseJob.input.numSteps,
        guidance: input.guidance ?? baseJob.input.guidance,
        maxRuns: input.maxRuns ?? baseJob.input.maxRuns,
        upsamplePromptMode: input.upsamplePromptMode ?? baseJob.input.upsamplePromptMode,
        similarityThreshold: input.similarityThreshold ?? baseJob.input.similarityThreshold,
        resultFileName: `${String(input.order).padStart(3, '0')}-training-photo-set-${dimensionSuffix}.png`,
      }

      jobs.push(newJob);
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
