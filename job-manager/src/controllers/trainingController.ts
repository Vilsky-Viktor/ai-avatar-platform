import { Request, Response, NextFunction } from 'express';
import {
  InferenceJob,
  TrainingJob,
  MediaTypes,
  JobTargets,
  JobStatuses,
  TrainingJobRequest,
  InferenceJobMetadata,
  TrainingJobMetadata,
} from '../types/job';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { generateTrainingPhotoSetData } from '../utils/trainingPhotoSetInputData';
import { generatePhotoSetCaptions } from '../utils/trainingPhotoSetCaptions';
import { genTrainingTwinIdPhotoData, genTrainingSyntheticIdPhotoData } from '../utils/trainingIdPhotoInputData';
import {
  getByGroupId as getByGroupIdDb,
  create as createDb,
  createMany as createManyDb,
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { buildTrainingPhotoSetJobs } from '../utils/jobBuilder';
import { buildQwenImageEditToolkitConfig } from '../utils/qwenImageEditTrainingConfig';
import { buildWan22A14bToolkitConfig } from '../utils/wan22A14bTrainingConfig';
import uuid from 'uuid';
import imageRatios from '../types/image';
import { AvatarLoras } from '../types/avatar';

const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';
const AI_TOOLKIT_TOPIC = process.env.AI_TOOLKIT_TOPIC || 'ai-toolkit';

export const trainLoras = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  req.log.info(`Train LORAs for user ${userId} with group ID ${jobRequest.groupId}`);

  try {
    const jobs = await getByGroupIdDb(userId, jobRequest.groupId!);

    const completedJobs = (jobs as InferenceJob[])
      .filter(j => j.status === JobStatuses.completed && j.result?.mediaPath)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!completedJobs.length) {
      return res.status(400).json({ error: 'No completed jobs with media found in group' });
    }

    const captions = generatePhotoSetCaptions(jobRequest.parameters);
    const mediaPaths = completedJobs.map(j => j.result!.mediaPath!);
    const prompts = completedJobs.map(j => captions.find(c => c.order === j.order)?.caption ?? '');
    const resolution = completedJobs[0].input.inference.width as number;

    const qwenJob: TrainingJob = {
      groupId: jobRequest.groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.qwenEdit2511Lora,
      status: JobStatuses.pending,
      maxRuns: 1,
      input: {
        checkDependencies: false,
        training: {
          modelName: 'qwen-edit-2511',
          mediaPaths,
          prompts,
          toolkit: buildQwenImageEditToolkitConfig(mediaPaths.length),
        },
      },
      metadata: { queueTopic: AI_TOOLKIT_TOPIC } as TrainingJobMetadata,
      result: { fileName: 'qwen-edit-2511-lora.safetensors' },
    };

    const wanJob: TrainingJob = {
      groupId: jobRequest.groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.wan22A14bLora,
      status: JobStatuses.pending,
      maxRuns: 1,
      input: {
        checkDependencies: false,
        training: {
          modelName: 'wan22-a14b',
          mediaPaths,
          prompts,
          toolkit: buildWan22A14bToolkitConfig(mediaPaths.length),
        },
      },
      metadata: { queueTopic: AI_TOOLKIT_TOPIC } as TrainingJobMetadata,
      result: { fileName: 'wan22-a14b-lora.safetensors' },
    };

    const [dbQwenJob, dbWanJob] = await Promise.all([
      createDb(userId, qwenJob),
      createDb(userId, wanJob),
    ]);
    await Promise.all([
      publishJob(AI_TOOLKIT_TOPIC, dbQwenJob),
      publishJob(AI_TOOLKIT_TOPIC, dbWanJob),
    ]);

    const loras: AvatarLoras = {
      qwenEdit2511: { path: '', filename: '' },
      wan22A14b: { path: '', filename: '' },
    };
    return res.status(201).json(loras);
  } catch (error) {
    req.log.info(`Failed to create jobs to train LORAs with group ID ${jobRequest.groupId} for ${userId}: ${error}`);
    next(error);
  }
};

export const genTrainingSyntheticFrontIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;
  const groupId = uuid.v4();

  req.log.info(`Create synthetic front ID photo job for user ${userId} with group ID ${groupId}`);

  const idPhotoSet: IdPhotoSetPaths = { uploaded: {}, generated: {} };

  try {
    const inputs = genTrainingSyntheticIdPhotoData(jobRequest.parameters, idPhotoSet);
    const frontInput = inputs[0];
    const inference = frontInput.input?.inference;

    const newJob: InferenceJob = {
      groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: frontInput.maxRuns ?? 3,
      order: frontInput.order,
      input: frontInput.input!,
      metadata: { ...frontInput.metadata, queueTopic: GEN_QWEN_EDIT_2511_TOPIC } as InferenceJobMetadata,
      result: { fileName: `${String(frontInput.order).padStart(3, '0')}-training-photo-set-${groupId}-${inference?.width}x${inference?.height}.png` },
    };

    const dbJob = await createDb(userId, newJob);
    await publishJob(GEN_QWEN_EDIT_2511_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create synthetic front ID photo job for ${userId}: ${error}`);
    next(error);
  }
};

export const genTrainingSyntheticIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  const trainingRatio = imageRatios.qwenEdit2511['1:1T'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  req.log.info(`Create synthetic ID photo jobs for user ${userId} with group ID ${jobRequest.groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;
  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {},
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      upperBody: `${avatarMediaPath}/008-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      body: `${avatarMediaPath}/009-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
    },
  };

  try {
    const inputs = genTrainingSyntheticIdPhotoData(jobRequest.parameters, idPhotoSet);
    const inputsWithoutFront = inputs.slice(1);

    const baseJob: Partial<InferenceJob> = {
      groupId: jobRequest.groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    };

    const jobs = buildTrainingPhotoSetJobs(baseJob, inputsWithoutFront, jobRequest.groupId!);
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create synthetic ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
};

export const genTrainingTwinIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;
  const groupId = uuid.v4();

  const trainingRatio = imageRatios.qwenEdit2511['1:1T'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  req.log.info(`Create twin ID photo jobs for user ${userId} with group ID ${groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;
  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {
      front: `${avatarMediaPath}/uploaded/front-cropped-${trainingDimensions}.png`,
      frontSmile: `${avatarMediaPath}/uploaded/frontSmile-cropped-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/uploaded/rightQuarter-cropped-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/uploaded/leftQuarter-cropped-${trainingDimensions}.png`,
    },
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${groupId}-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${groupId}-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${groupId}-${trainingDimensions}.png`,
      upperBody: `${avatarMediaPath}/008-training-photo-set-${groupId}-${trainingDimensions}.png`,
      body: `${avatarMediaPath}/009-training-photo-set-${groupId}-${trainingDimensions}.png`,
    },
  };

  try {
    const inputs = genTrainingTwinIdPhotoData(jobRequest.parameters, idPhotoSet);

    const baseJob: Partial<InferenceJob> = {
      groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    };

    const jobs = buildTrainingPhotoSetJobs(baseJob, inputs, groupId);
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create twin ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
};

export const genTrainingPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  const trainingRatio = imageRatios.qwenEdit2511['1:1T'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  req.log.info(`Create Photo Set jobs for user ${userId} with group ID ${jobRequest.groupId}`);

  try {
    const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;
    const idPhotoSet: IdPhotoSetPaths = {
      uploaded: {},
      generated: {
        front: `${avatarMediaPath}/001-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        frontSmile: `${avatarMediaPath}/002-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        rightQuarter: `${avatarMediaPath}/003-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        leftQuarter: `${avatarMediaPath}/004-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        rightSide: `${avatarMediaPath}/005-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        leftSide: `${avatarMediaPath}/006-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        upperBody: `${avatarMediaPath}/008-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
        body: `${avatarMediaPath}/009-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      },
    };

    const inputs = generateTrainingPhotoSetData(jobRequest.parameters, jobRequest.avatarType, idPhotoSet);

    const baseJob: Partial<InferenceJob> = {
      groupId: jobRequest.groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    };

    const jobs = buildTrainingPhotoSetJobs(baseJob, inputs, jobRequest.groupId!);
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create Photo Set jobs for ${userId}: ${error}`);
    next(error);
  }
};
