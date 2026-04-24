import { Request, Response, NextFunction } from 'express';
import {
  Job,
  InferenceJob,
  TrainingJob,
  MediaTypes,
  JobTargets,
  JobStatuses,
  TrainingJobRequest,
  InferenceJobMetadata,
  TrainingJobMetadata,
  PhotoJobRequest,
} from '../types/job';
import { IdPhotoSetPaths } from '../types/trainingPhotoSet';
import { generateTrainingPhotoSetData } from '../utils/photoSetInputData';
import { AVATAR_REFERENCE_NAME } from '../utils/photoSetCaptions';
import { generatePhotoSetCaptions } from '../utils/photoSetCaptions';
import { genTrainingTwinIdPhotoData, genTrainingSyntheticIdPhotoData } from '../utils/idPhotoInputData';
import {
  getById as getByIdDb,
  getByGroupId as getByGroupIdDb,
  create as createDb,
  createMany as createManyDb,
  update as updateDb,
  deleteById as deleteByIdDb,
  deleteByAvatarId as deleteByAvatarIdDb,
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { getAvatarById } from '../services/avatarService';
import { buildPhotoSetJobs } from '../utils/jobBuilder';
import { buildQwenImageEditToolkitConfig } from '../utils/qwenImageEditTrainingConfig';
import uuid from 'uuid';
import imageRatios from '../types/imageRatios';
import { AvatarLoras } from '../types/avatar';


const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';
const AI_TOOLKIT_TOPIC = process.env.AI_TOOLKIT_TOPIC || 'ai-toolkit';

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
}

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

    const trainingJob: TrainingJob = {
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
          toolkit: buildQwenImageEditToolkitConfig(mediaPaths.length, resolution),
        },
      },
      metadata: { queueTopic: AI_TOOLKIT_TOPIC } as TrainingJobMetadata,
      result: { fileName: 'qwen-edit-2511-lora.safetensors' },
    };

    const dbJob = await createDb(userId, trainingJob);
    await publishJob(AI_TOOLKIT_TOPIC, dbJob);

    const loras: AvatarLoras = { qwenEdit2511Path: '' };
    return res.status(201).json(loras);
  } catch (error) {
    req.log.info(`Failed to create jobs to train LORAs with group ID ${jobRequest.groupId} for ${userId}: ${error}`);
    next(error);
  }
}

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
      userId: userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: frontInput.maxRuns ?? 3,
      order: frontInput.order,
      input: frontInput.input!,
      metadata: { ...frontInput.metadata, queueTopic: GEN_QWEN_EDIT_2511_TOPIC } as InferenceJobMetadata,
      result: { fileName: `${String(frontInput.order).padStart(3, '0')}-training-photo-set-${groupId}-${inference?.width}x${inference?.height}.png` }
    }

    const dbJob = await createDb(userId, newJob);

    await publishJob(GEN_QWEN_EDIT_2511_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create synthetic front ID photo job for ${userId}: ${error}`);
    next(error);
  }
}

export const genTrainingSyntheticIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  const trainingRatio = imageRatios.qwenEdit2511['1:1'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  req.log.info(`Create synthetic ID photo jobs for user ${userId} with group ID ${jobRequest.groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {},
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      body: `${avatarMediaPath}/008-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
    }
  }

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
    }

    const jobs = buildPhotoSetJobs(baseJob, inputsWithoutFront, jobRequest.groupId!);

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create synthetic ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
}

export const genTrainingTwinIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;
  const groupId = uuid.v4();

  const trainingRatio = imageRatios.qwenEdit2511['1:1'];
  const trainingDimensions = `${trainingRatio[0]}x${trainingRatio[1]}`;

  req.log.info(`Create twin ID photo jobs for user ${userId} with group ID ${groupId}`);

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;

  const idPhotoSet: IdPhotoSetPaths = {
    uploaded: {
      front: `${avatarMediaPath}/uploaded/front-${trainingDimensions}.png`,
      frontSmile: `${avatarMediaPath}/uploaded/frontSmile-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/uploaded/rightQuarter-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/uploaded/leftQuarter-${trainingDimensions}.png`,
    },
    generated: {
      front: `${avatarMediaPath}/001-training-photo-set-${groupId}-${trainingDimensions}.png`,
      rightQuarter: `${avatarMediaPath}/003-training-photo-set-${groupId}-${trainingDimensions}.png`,
      leftQuarter: `${avatarMediaPath}/004-training-photo-set-${groupId}-${trainingDimensions}.png`,
      upperBody: `${avatarMediaPath}/008-training-photo-set-${groupId}-${trainingDimensions}.png`,
      body: `${avatarMediaPath}/009-training-photo-set-${groupId}-${trainingDimensions}.png`,
    }
  }

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
    }

    const jobs = buildPhotoSetJobs(baseJob, inputs, groupId);

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create twin ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
}


export const genTrainingPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: TrainingJobRequest = req.body;

  const trainingRatio = imageRatios.qwenEdit2511['1:1'];
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
        body: `${avatarMediaPath}/008-training-photo-set-${jobRequest.groupId}-${trainingDimensions}.png`,
      }
    }

    const inputs = generateTrainingPhotoSetData(jobRequest.parameters, jobRequest.avatarType, idPhotoSet);

    const baseJob: Partial<InferenceJob> = {
      groupId: jobRequest.groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.trainingPhotoSet,
      status: JobStatuses.pending,
      maxRuns: 3,
    }

    const jobs = buildPhotoSetJobs(baseJob, inputs, jobRequest.groupId!);

    const dbJobs = await createManyDb(userId, jobs);

    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create Photo Set jobs for ${userId}: ${error}`);
    next(error);
  }

}

export const genAvatarPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: PhotoJobRequest = req.body;
  const fileId = uuid.v4();

  const [width, height] = imageRatios.qwenEdit2511[jobRequest.ratio];
  const dimensions = `${width}x${height}`;

  req.log.info(`Generate avatar photo for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);
    const loraPath = avatar.loras.qwenEdit2511Path;

    const job: InferenceJob = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      input: {
        checkDependencies: false,
        inference: {
          prompt: `${AVATAR_REFERENCE_NAME} ${jobRequest.prompt}`,
          numSteps: 50,
          guidanceScale: 4.0,
          width,
          height,
        },
        loras: [{ path: loraPath, scale: 1.0 }],
      },
      metadata: {
        queueTopic: GEN_QWEN_EDIT_2511_TOPIC,
        ratio: jobRequest.ratio,
        dimensions,
      } as InferenceJobMetadata,
      result: {
        fileName: `${fileId}-${dimensions}.png`,
      },
    };

    const dbJob = await createDb(userId, job);
    await publishJob(GEN_QWEN_EDIT_2511_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate avatar photo for ${userId}: ${error}`);
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
      fileName: job.result?.fileName
    };

    job.status = JobStatuses.pending;

    await updateDb(userId, id, job, true);
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
    await deleteByIdDb(userId, id);

    return res.status(200).json({'result': 'ok'});
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

    return res.status(200).json({'result': 'ok'});
  } catch (error) {
    req.log.info(`Failed to delete jobs for ${avatarId} and user ${userId}: ${error}`);
    next(error);
  }
};
