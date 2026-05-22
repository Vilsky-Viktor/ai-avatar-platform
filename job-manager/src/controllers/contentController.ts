import { Request, Response, NextFunction } from 'express';
import {
  InferenceJob,
  LoraData,
  MediaTypes,
  JobTargets,
  JobStatuses,
  PhotoJobRequest,
  InferenceJobMetadata,
  PhotoSetJobRequest,
  VideoJobRequest,
} from '../types/job';
import { AVATAR_REFERENCE_NAME } from '../utils/trainingPhotoSetCaptions';
import { 
  getAvatarIdPhotos as getAvatarIdPhotosDb, 
  create as createDb, 
  createMany as createManyDb
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { getAvatarById } from '../services/avatarService';
import uuid from 'uuid';
import imageRatios, { PhotoSetType, wan22Ti2v } from '../types/image';
import { genOutfitStylesData, genTravelingAroundTheWorldData, genWhatsappStickersData, genLuxuryLifeData } from '../utils/photoSetInputData';
import { buildPhotoSetJobs } from '../utils/jobBuilder';

const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';
const GEN_WAN_22_TI2V_TOPIC = process.env.GEN_WAN_22_TI2V_TOPIC || 'gen-wan-22-ti2v';

const WAN_22_TI2V_NUM_STEPS = 50;
const WAN_22_TI2V_FPS = 16;
const WAN_22_TI2V_DEFAULT_VIDEO_LENGTH = 5 * WAN_22_TI2V_FPS;
const WAN_22_TI2V_NEGATIVE_PROMPT = 'static, motionless, frozen, slow motion, no movement, blurry, low quality, distorted';

export const genAvatarPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: PhotoJobRequest = req.body;
  const fileId = uuid.v4();

  const [width, height] = imageRatios.qwenEdit2511[jobRequest.ratio];
  const dimensions = `${width}x${height}`;

  req.log.info(`Generate avatar photo for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);

    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs.map((job: InferenceJob) => job.result?.mediaPath!);

    const job: InferenceJob = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 3,
      input: {
        checkDependencies: false,
        inference: {
          prompt: `${AVATAR_REFERENCE_NAME} ${jobRequest.prompt}`,
          mediaPaths: jobRequest.referenceImagePaths || [],
          numSteps: 8,
          guidanceScale: 1.0,
          width,
          height,
        },
        faceRecognition: {
          enabled: true,
          mediaPaths: idPhotos,
          threshold: { min: 0.95 },
        },
        loras: [
          { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.6 },
          { path: avatar.loras.qwenEdit2511.path, scale: 1.0, filename: avatar.loras.qwenEdit2511.filename },
        ],
      },
      metadata: {
        queueTopic: GEN_QWEN_EDIT_2511_TOPIC,
        ratio: jobRequest.ratio,
        dimensions,
        userPrompt: jobRequest.prompt
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
};

export const genAvatarPhotoSet = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest = req.body as PhotoSetJobRequest;
  const groupId = uuid.v4();

  const functionMapping: Record<PhotoSetType, Function> = {
    'whatsapp-stickers': genWhatsappStickersData,
    'outfit-styles': genOutfitStylesData,
    'around-the-world': genTravelingAroundTheWorldData,
    'luxury-life': genLuxuryLifeData
  }
  
  req.log.info(`Generate avatar photo set for user ${userId}, group ${groupId}, avatar ${jobRequest.avatarId}`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);

    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: InferenceJob) => [1,2].includes(job.order!))
      .map((job: InferenceJob) => job.result?.mediaPath!);
      
    const inputs = functionMapping[jobRequest.type!](avatar.loras.qwenEdit2511, idPhotos, avatar.parameters);

    const baseJob: Partial<InferenceJob> = {
      groupId: groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 3,
      metadata: {
        queueTopic: GEN_QWEN_EDIT_2511_TOPIC,
        userPrompt: '',
      } as InferenceJobMetadata,
    };

    const jobs = buildPhotoSetJobs(baseJob, inputs);
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(GEN_QWEN_EDIT_2511_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to generate avatar photo set for ${userId}: ${error}`);
    next(error);
  }
}

export const genAvatarVideo = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: VideoJobRequest = req.body;
  const fileId = uuid.v4();

  req.log.info(`Generate avatar video for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);

    const [width, height] = wan22Ti2v[jobRequest.ratio];
    const dimensions = `${width}x${height}`;

    const isI2V = jobRequest.referenceImagePaths && jobRequest.referenceImagePaths.length > 0;
    const mediaPaths = isI2V ? [jobRequest.referenceImagePaths![0]] : [];
    const videoLength = jobRequest.lengthSec
      ? jobRequest.lengthSec * WAN_22_TI2V_FPS
      : WAN_22_TI2V_DEFAULT_VIDEO_LENGTH;

    const loras: LoraData[] = avatar.loras.wan22T2vA14b ? [
      { path: avatar.loras.wan22T2vA14b.path, filename: 'high_noise_lora.safetensors', scale: 1.0, boundary: 'high' },
      { path: avatar.loras.wan22T2vA14b.path, filename: 'low_noise_lora.safetensors', scale: 1.0, boundary: 'low' },
    ] : [];

    const job: InferenceJob = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.video,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      input: {
        checkDependencies: false,
        inference: {
          prompt: `${AVATAR_REFERENCE_NAME} ${jobRequest.prompt}`,
          negativePrompt: WAN_22_TI2V_NEGATIVE_PROMPT,
          guidanceScale: 6.0,
          mediaPaths,
          numSteps: WAN_22_TI2V_NUM_STEPS,
          width,
          height,
          videoLength,
          fps: WAN_22_TI2V_FPS,
        },
        loras,
      },
      metadata: {
        queueTopic: GEN_WAN_22_TI2V_TOPIC,
        ratio: jobRequest.ratio,
        dimensions,
        userPrompt: jobRequest.prompt,
        lengthSec: jobRequest.lengthSec,
      } as InferenceJobMetadata,
      result: {
        fileName: `${fileId}-${dimensions}.mp4`,
      },
    };

    const dbJob = await createDb(userId, job);
    await publishJob(GEN_WAN_22_TI2V_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate avatar video for ${userId}: ${error}`);
    next(error);
  }
}