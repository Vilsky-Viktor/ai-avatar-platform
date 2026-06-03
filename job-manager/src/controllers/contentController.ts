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
  VideoGenerator,
  Models,
  Flows,
  AudioJobRequest,
  AudioGenerator,
  LipSync,
  MimicMotionRequest,
} from '../types/job';
import { 
  getAvatarIdPhotos as getAvatarIdPhotosDb, 
  create as createDb, 
  createMany as createManyDb
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import { getAvatarById } from '../services/avatarService';
import uuid from 'uuid';
import { genOutfitStylesData, genTravelingAroundTheWorldData, genLuxuryLifeData, genWhatsappStickersData } from '../utils/photoSetInputData';
import { IdPhotoSetPaths } from '../types/idPhotoSet';


const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';


export const genAvatarPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: PhotoJobRequest = req.body;
  const imageId = uuid.v4();

  req.log.info(`Generate avatar photo for user ${userId}, avatar ${jobRequest.avatarId}, ratio ${jobRequest.ratio}`);

  try {
    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}.png`

    const refCount = jobRequest.mediaPaths?.length ?? 0;
    const idPhotoStart = refCount + 1;
    const idPhotoEnd = refCount + idPhotos.length;

    const imageGenerator: ImageGenerator = {
      service: Services.imageGenerator,
      prompt: `${jobRequest.prompt}. Person identity images from image ${idPhotoStart} to image ${idPhotoEnd}`,
      negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
      imagePaths: [...jobRequest.mediaPaths!, ...idPhotos],
      temperature: 1.0,
      ratio: jobRequest.ratio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.googleImage3Pro,
      flow: Flows.ti2i,
    };

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 3,
      curRun: 0,
      workflow: [imageGenerator],
      metadata: { ratio: jobRequest.ratio, userPrompt: jobRequest.prompt },
      resultMediaPath: generatorUploadPath
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
      leftQuarter: idPhotos[2],
      rightQuarter: idPhotos[3],
      leftSide: idPhotos[4],
      rightSide: idPhotos[5],
      body: idPhotos[6]
    }
  
    const inputs = functionMapping[jobRequest.type!](userId, jobRequest.avatarId, avatar.parameters, idPhotoSet);

    const jobs: Job[] = inputs.map((input: any) => {
      return {
        userId,
        groupId,
        avatarId: jobRequest.avatarId,
        mediaType: MediaTypes.image,
        target: JobTargets.avatarMedia,
        status: JobStatuses.pending,
        maxRuns: 3,
        curRun: 0,
        order: input.order,
        workflow: [input.imageGenerator],
        metadata: {...input.metadata, userPrompt: input.imageGenerator.prompt},
        resultMediaPath: input.imageGenerator.uploadPath!
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
    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: Job) => [1,2,3,4].includes(job.order!))
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}.mp4`;

    const mediaPaths = jobRequest.mediaPaths ?? [];
    const hasObjectPhotos = mediaPaths.length > 1;
    const identityRef = hasObjectPhotos ? '@Element2' : '@Element1';
    const objectRefPaths = hasObjectPhotos ? mediaPaths.slice(1) : [];

    const videoGenerator: VideoGenerator = {
      service: Services.videoGenerator,
      prompt: `${jobRequest.prompt}. Person identity from ${identityRef}`,
      negativePrompt: 'blur, distort, and low quality, crossed hands',
      imagePath: mediaPaths[0] ?? '',
      imageRefPaths: idPhotos,
      objectRefPaths,
      duration: jobRequest.lengthSec!,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.kling,
      flow: Flows.ti2v,
    };

    let workflow = [videoGenerator] as Job['workflow'];

    if (jobRequest.audioText) {
      const avatar = await getAvatarById(userId, jobRequest.avatarId);

      const audioId = uuid.v4();
      const audioUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/audios/${audioId}.mp3`;

      const audioGenerator: AudioGenerator = {
        service: Services.audioGenerator,
        model: Models.eleven,
        flow: Flows.t2a,
        status: JobStatuses.pending,
        text: jobRequest.audioText,
        voice: avatar.voiceId!,
        uploadPath: audioUploadPath,
      };

      const lipSync: LipSync = {
        service: Services.lipSync,
        model: Models.lipSync,
        flow: Flows.va2v,
        status: JobStatuses.pending,
        videoPath: generatorUploadPath,
        audioPath: audioUploadPath,
        uploadPath: generatorUploadPath
      };

      workflow = [videoGenerator, audioGenerator, lipSync];
    } else if (jobRequest.audioPath) {
      const lipSync: LipSync = {
        service: Services.lipSync,
        model: Models.lipSync,
        flow: Flows.va2v,
        status: JobStatuses.pending,
        videoPath: generatorUploadPath,
        audioPath: jobRequest.audioPath,
        uploadPath: generatorUploadPath,
      };

      workflow = [videoGenerator, lipSync];
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.video,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow,
      metadata: { ratio: jobRequest.ratio, userPrompt: jobRequest.prompt },
      resultMediaPath: generatorUploadPath
    }
      
    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);
    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate avatar video for ${userId}: ${error}`);
    next(error);
  }
}

export const mimicMotion = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: MimicMotionRequest = req.body;
  const videoId = uuid.v4();

  req.log.info(`Generate mimic motion video for user ${userId}, avatar ${jobRequest.avatarId}`);

  try {
    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: Job) => [1,2,3,4].includes(job.order!))
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}.mp4`;

    const videoGenerator: VideoGenerator = {
      service: Services.videoGenerator,
      imagePath: jobRequest.imagePath,
      videoPath: jobRequest.videoPath,
      imageRefPaths: idPhotos,
      keepOriginalAudio: jobRequest.keepOriginalAudio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.kling,
      flow: Flows.v2v,
    };

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.video,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow: [videoGenerator],
      metadata: { userPrompt: 'Mimic motion' },
      resultMediaPath: generatorUploadPath
    }

    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);
    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate mimic motion video for ${userId}: ${error}`);
    next(error);
  }
}

export const genAvatarAudio = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: AudioJobRequest = req.body;
  const audioId = uuid.v4();

  req.log.info(`Generate avatar audio for user ${userId}, avatar ${jobRequest.avatarId}`);

  try {
    const avatar = await getAvatarById(userId, jobRequest.avatarId);
    const uploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/audios/${audioId}.mp3`;

    const audioGenerator: AudioGenerator = {
      service: Services.audioGenerator,
      model: Models.eleven,
      flow: Flows.t2a,
      status: JobStatuses.pending,
      text: jobRequest.prompt,
      voice: avatar.voiceId!,
      uploadPath
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.audio,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow: [audioGenerator],
      metadata: { userPrompt: jobRequest.prompt },
      resultMediaPath: uploadPath
    }

    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);
    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to generate avatar audio for ${userId}: ${error}`);
    next(error);
  }

}