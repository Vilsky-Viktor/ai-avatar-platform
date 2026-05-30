import { Request, Response, NextFunction } from 'express';
import {
  Job,
  MediaTypes,
  JobTargets,
  JobStatuses,
  PhotoJobRequest,
  PhotoSetJobRequest,
  VideoJobRequest,
  ImageGenerator,
  Upscaler,
  Services,
  PhotoSetType,
  videoGenerator,
  Models,
  Flows,
} from '../types/job';
import { 
  getAvatarIdPhotos as getAvatarIdPhotosDb, 
  create as createDb, 
  createMany as createManyDb
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { getAvatarById } from '../services/avatarService';
import uuid from 'uuid';
import { genOutfitStylesData, genTravelingAroundTheWorldData, genWhatsappStickersData, genLuxuryLifeData } from '../utils/photoSetInputData';
import { IdPhotoSetPaths } from '../types/idPhotoSet';


const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';


export const genAvatarPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: PhotoJobRequest = req.body;
  const imageId = uuid.v4();

  req.log.info(`Generate avatar photo for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}`);

  try {
    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs.map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-userId/avatars/${jobRequest.avatarId}/images/${imageId}.png`
    const upscalerUploadPath = `media/${userId}-userId/avatars/${jobRequest.avatarId}/images/${imageId}-upscaled.png`

    const imageGenerator: ImageGenerator = {
      service: Services.imageGenerator,
      prompt: jobRequest.prompt,
      negativePrompt: 'blurry face, low quality, distorted face, oversaturated, unrealistic skin, plastic skin',
      imagePaths: [...jobRequest.mediaPaths!, ...idPhotos],
      safetyTolerance: 2,
      ratio: jobRequest.ratio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.flux,
      flow: Flows.ti2i,
    };

    const upscaler: Upscaler = {
      service: Services.upscaler,
      imagePath: generatorUploadPath,
      uploadPath: upscalerUploadPath,
      status: JobStatuses.pending,
      model: Models.topaz,
      flow: Flows.i2i,
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 3,
      curRun: 0,
      workflow: [imageGenerator, upscaler],
      metadata: { ratio: jobRequest.ratio },
      resultMediaPath: upscalerUploadPath
    }

    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);

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
    const idPhotos = idPhotoJobs.map((job: Job) => job.resultMediaPath);
  
    const idPhotoSet: IdPhotoSetPaths = {
      front: idPhotos[0],
      frontSmile: idPhotos[1],
    }
  
    const inputs = functionMapping[jobRequest.type!](userId, jobRequest.avatarId, avatar.parameters, idPhotoSet);

    const jobs: Job[] = inputs.map((input: any) => {
      const generatorUploadPath = input.imageGenerator.uploadPath!;
      const dotIndex = generatorUploadPath.lastIndexOf('.');
      const upscalerUploadPath = `${generatorUploadPath.slice(0, dotIndex)}-upscaled${generatorUploadPath.slice(dotIndex)}`;

      const upscaler: Upscaler = {
        service: Services.upscaler,
        imagePath: generatorUploadPath,
        uploadPath: upscalerUploadPath,
        status: JobStatuses.pending,
        model: Models.topaz,
        flow: Flows.i2i,
      };

      return {
        userId,
        groupId,
        avatarId: jobRequest.avatarId,
        mediaType: MediaTypes.image,
        target: JobTargets.idPhoto,
        status: JobStatuses.pending,
        maxRuns: 3,
        curRun: 0,
        order: input.order,
        workflow: [input.imageGenerator, upscaler],
        metadata: input.metadata,
        resultMediaPath: upscalerUploadPath
      }
    })
    
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(WORKFLOW_MANAGER_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to generate avatar photo set for ${userId}: ${error}`);
    next(error);
  }
}

export const genAvatarVideo = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: VideoJobRequest = req.body;
  const videoId = uuid.v4();

  req.log.info(`Generate avatar video for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}, length ${jobRequest.lengthSec}s`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);
    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: Job) => [1,3,4,5].includes(job.order!))
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-userId/avatars/${jobRequest.avatarId}/videos/${videoId}.png`
    const upscalerUploadPath = `media/${userId}-userId/avatars/${jobRequest.avatarId}/videos/${videoId}-upscaled.png`

    const videoGenerator: videoGenerator = {
      service: Services.videoGenerator,
      prompt: jobRequest.prompt,
      negativePrompt: 'blur, distort, and low quality',
      imagePath: jobRequest.mediaPaths ? jobRequest.mediaPaths[0] : '',
      imageRefPaths: idPhotos,
      duration: jobRequest.lengthSec!,
      ratio: jobRequest.ratio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.kling,
      flow: Flows.ti2v,
    };

    const upscaler: Upscaler = {
      service: Services.upscaler,
      videoPath: generatorUploadPath,
      uploadPath: upscalerUploadPath,
      status: JobStatuses.pending,
      model: Models.topaz,
      flow: Flows.v2v,
    };

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow: [videoGenerator, upscaler],
      metadata: { ratio: jobRequest.ratio },
      resultMediaPath: upscalerUploadPath
    }
      
    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);
    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate avatar video for ${userId}: ${error}`);
    next(error);
  }
}