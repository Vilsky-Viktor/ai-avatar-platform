import { Request, Response, NextFunction } from 'express';
import {
  Job,
  MediaTypes,
  JobTargets,
  JobStatuses,
  PhotoJobRequest,
  PhotoSetJobRequest,
  VideoJobRequest,
  PhotoSetType,
  Models,
  AudioJobRequest,
  AiModelGateway,
  MimicMotionRequest,
  Platforms,
  Services,
  ThumbnailMaker,
} from '@loom24/shared/types';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import {
  getAvatarIdPhotos as getAvatarIdPhotosDb,
  create as createDb,
  createMany as createManyDb
} from '../repositories/job';
import { sendJob, sendJobs } from '@loom24/shared/services';
import { getAvatarById } from '../services/avatarService';
import uuid from 'uuid';
import { genOutfitStylesData, genTravelingAroundTheWorldData, genLuxuryLifeData, genWhatsappStickersData } from '../utils/photoSetInputData';
import { IdPhotoSetPaths } from '../types/idPhotoSet';


const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SERVICE_NAME = process.env.SERVICE_NAME || 'job-manager';


export const genAvatarPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: PhotoJobRequest = req.body;
  const imageId = uuid.v4();

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ ratio: jobRequest.ratio }, 'Generate avatar photo');

    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}.png`;
    const thumbnailUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}-thumbnail.jpg`

    const refCount = jobRequest.mediaPaths?.length ?? 0;
    const idPhotoStart = refCount + 1;
    const idPhotoEnd = refCount + idPhotos.length;

    const imageGenerator: AiModelGateway = {
      prompt: `${jobRequest.prompt}. Person identity images from image ${idPhotoStart} to image ${idPhotoEnd}`,
      negativePrompt: 'disproportion, low quality, blurred face, blurry, distorted face, warped facial features, wrong body type, wrong body hair density, another person, changed identity, low resolution, compression artifacts',
      imagePaths: [...(jobRequest.mediaPaths ?? []), ...idPhotos],
      temperature: 1.0,
      ratio: jobRequest.ratio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.geminiImage3Pro,
      platform: Platforms.google,
      service: Services.aiModelGateway
    };

    const thumbnailMaker: ThumbnailMaker = {
      mediaType: MediaTypes.image,
      mediaPath: generatorUploadPath,
      size: 400,
      service: Services.thumbnailMaker,
      status: JobStatuses.pending,
      uploadPath: thumbnailUploadPath
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 3,
      curRun: 0,
      workflow: [imageGenerator, thumbnailMaker],
      metadata: { ratio: jobRequest.ratio, userPrompt: jobRequest.prompt },
      resultMediaPath: generatorUploadPath,
      resultThumbnailPath: thumbnailUploadPath
    }

    const dbJob = await createDb(userId, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);

    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate avatar photo');
    next(error);
  } finally {
    clearLogContext();
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

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ groupId }, 'Generate avatar photo set');

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
      const rawPath = input.imageGenerator.uploadPath as string;
      const dotIdx = rawPath.lastIndexOf('.');
      const thumbnailUploadPath = `${dotIdx >= 0 ? rawPath.slice(0, dotIdx) : rawPath}-thumbnail.jpg`;

      const thumbnailMaker: ThumbnailMaker = {
        mediaType: MediaTypes.image,
        mediaPath: input.imageGenerator.uploadPath!,
        size: 400,
        service: Services.thumbnailMaker,
        status: JobStatuses.pending,
        uploadPath: thumbnailUploadPath
      }

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
        workflow: [input.imageGenerator, thumbnailMaker],
        metadata: {...input.metadata, userPrompt: input.imageGenerator.prompt},
        resultMediaPath: input.imageGenerator.uploadPath!,
        resultThumbnailPath: thumbnailUploadPath,
      }
    })

    const dbJobs = await createManyDb(userId, jobs);
    await sendJobs(WORKFLOW_MANAGER_TOPIC, dbJobs, SERVICE_NAME);

    return res.status(201).json(dbJobs);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate avatar photo set');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const genAvatarVideo = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: VideoJobRequest = req.body;
  const videoId = uuid.v4();

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ ratio: jobRequest.ratio, lengthSec: jobRequest.lengthSec }, 'Generate avatar video');

    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: Job) => [1,2,3,4].includes(job.order!))
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}.mp4`;
    const thumbnailUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}-thumbnail.jpg`;

    const mediaPaths = jobRequest.mediaPaths ?? [];
    const hasObjectPhotos = mediaPaths.length > 1;
    const identityRef = hasObjectPhotos ? '@Element2' : '@Element1';
    const objectRefPaths = hasObjectPhotos ? mediaPaths.slice(1) : [];

    const videoGenerator: AiModelGateway = {
      prompt: `${jobRequest.prompt}. Person identity from ${identityRef}`,
      negativePrompt: 'blur, distort, and low quality, crossed hands',
      imagePaths: mediaPaths,
      idPhotoPaths: idPhotos,
      objectRefPaths,
      duration: jobRequest.lengthSec!,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.klingV3ProImageToVideo,
      platform: Platforms.falai,
      service: Services.aiModelGateway
    };

    let workflow = [videoGenerator] as Job['workflow'];

    if (jobRequest.audioText) {
      const avatar = await getAvatarById(userId, jobRequest.avatarId);

      const audioId = uuid.v4();
      const audioUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/audios/${audioId}.mp3`;

      const audioGenerator: AiModelGateway = {
        model: Models.elevenV3,
        platform: Platforms.falai,
        status: JobStatuses.pending,
        prompt: jobRequest.audioText,
        voice: avatar.voiceId!,
        uploadPath: audioUploadPath,
        service: Services.aiModelGateway
      };

      const lipSync: AiModelGateway = {
        model: Models.lipSyncV3,
        platform: Platforms.falai,
        status: JobStatuses.pending,
        videoPaths: [generatorUploadPath],
        audioPaths: [audioUploadPath],
        uploadPath: generatorUploadPath,
        service: Services.aiModelGateway
      };

      workflow = [videoGenerator, audioGenerator, lipSync];
    } else if (jobRequest.audioPath) {
      const lipSync: AiModelGateway = {
        model: Models.lipSyncV3,
        platform: Platforms.falai,
        status: JobStatuses.pending,
        videoPaths: [generatorUploadPath],
        audioPaths: [jobRequest.audioPath],
        uploadPath: generatorUploadPath,
        service: Services.aiModelGateway
      };

      workflow = [videoGenerator, lipSync];
    }

    const thumbnailMaker: ThumbnailMaker = {
      mediaType: MediaTypes.video,
      mediaPath: generatorUploadPath,
      size: 400,
      service: Services.thumbnailMaker,
      status: JobStatuses.pending,
      uploadPath: thumbnailUploadPath
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.video,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow: [...workflow, thumbnailMaker],
      metadata: { ratio: jobRequest.ratio, userPrompt: jobRequest.prompt },
      resultMediaPath: generatorUploadPath,
      resultThumbnailPath: thumbnailUploadPath,
    }

    const dbJob = await createDb(userId, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);
    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate avatar video');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const mimicMotion = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: MimicMotionRequest = req.body;
  const videoId = uuid.v4();

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info('Generate mimic motion video');

    const idPhotoJobs = await getAvatarIdPhotosDb(userId, jobRequest.avatarId);
    const idPhotos = idPhotoJobs
      .filter((job: Job) => [1,2,3,4].includes(job.order!))
      .map((job: Job) => job.resultMediaPath);

    const generatorUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}.mp4`;
    const thumbnailUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/videos/${videoId}-thumbnail.jpg`;

    const videoGenerator: AiModelGateway = {
      imagePaths: [jobRequest.imagePath],
      videoPaths: [jobRequest.videoPath],
      idPhotoPaths: idPhotos,
      keepOriginalAudio: jobRequest.keepOriginalAudio,
      uploadPath: generatorUploadPath,
      status: JobStatuses.pending,
      model: Models.klingV3ProMotionControl,
      platform: Platforms.falai,
      service: Services.aiModelGateway
    };

    const thumbnailMaker: ThumbnailMaker = {
      mediaType: MediaTypes.video,
      mediaPath: generatorUploadPath,
      size: 400,
      service: Services.thumbnailMaker,
      status: JobStatuses.pending,
      uploadPath: thumbnailUploadPath
    }

    const job: Job = {
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.video,
      target: JobTargets.avatarMedia,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      workflow: [videoGenerator, thumbnailMaker],
      metadata: { userPrompt: 'Mimic motion' },
      resultMediaPath: generatorUploadPath,
      resultThumbnailPath: thumbnailUploadPath
    }

    const dbJob = await createDb(userId, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);
    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate mimic motion video');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const genAvatarAudio = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: AudioJobRequest = req.body;
  const audioId = uuid.v4();

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info('Generate avatar audio');

    const avatar = await getAvatarById(userId, jobRequest.avatarId);
    const uploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/audios/${audioId}.mp3`;

    const audioGenerator: AiModelGateway = {
      model: Models.elevenV3,
      platform: Platforms.falai,
      status: JobStatuses.pending,
      prompt: jobRequest.prompt,
      voice: avatar.voiceId!,
      uploadPath,
      service: Services.aiModelGateway
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
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);
    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate avatar audio');
    next(error);
  } finally {
    clearLogContext();
  }
}
