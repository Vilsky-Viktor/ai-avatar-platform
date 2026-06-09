import { Request, Response, NextFunction } from 'express';
import {
  Job,
  MediaTypes,
  JobTargets,
  JobStatuses,
  IdPhotoJobRequest,
  Services,
  ThumbnailMaker,
  HeadDirectionChecker,
  Directions,
  ImageRatios,
  Cropper,
  AiModelGateway,
  Models,
  Platforms,
} from '@loom24/shared/types';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import { IdPhotoSetPaths } from '../types/idPhotoSet';
import { genDigitalTwinIdPhotoData, genSyntheticFrontIdPhtotoData, genSyntheticIdPhotoData } from '../utils/idPhotoInputData';
import {
  create as createDb,
  createMany as createManyDb,
} from '../repositories/job';
import { sendJob, sendJobs } from '@loom24/shared/services';
import uuid from 'uuid';


const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SERVICE_NAME = process.env.SERVICE_NAME || 'job-manager';


export const genSyntheticFrontIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;
  const groupId = uuid.v4();

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ groupId }, 'Create synthetic front ID photo job');

    const input = genSyntheticFrontIdPhtotoData(jobRequest.parameters, userId, jobRequest.avatarId);

    const rawPath = input.imageGenerator.uploadPath as string;
    const dotIdx = rawPath.lastIndexOf('.');
    const thumbnailUploadPath = `${dotIdx >= 0 ? rawPath.slice(0, dotIdx) : rawPath}-thumbnail.jpg`;

    const thumbnailMaker: ThumbnailMaker = {
      mediaType: MediaTypes.image,
      mediaPath: rawPath,
      size: 400,
      service: Services.thumbnailMaker,
      status: JobStatuses.pending,
      uploadPath: thumbnailUploadPath,
    };

    const headDirectionChecker: HeadDirectionChecker = {
      service: Services.headDirectionChecker,
      status: JobStatuses.pending,
      imagePath: input.imageGenerator.uploadPath!,
      direction: Directions.front
    }

    const job: Job = {
      groupId,
      userId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.idPhoto,
      status: JobStatuses.pending,
      maxRuns: 3,
      curRun: 0,
      order: 1,
      workflow: [input.imageGenerator, headDirectionChecker, thumbnailMaker],
      metadata: input.metadata,
      resultMediaPath: rawPath,
      resultThumbnailPath: thumbnailUploadPath,
    }

    const dbJob = await createDb(userId, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);

    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create synthetic front ID photo job');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const genSyntheticIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;

  const idPhotoSet: IdPhotoSetPaths = {
    front: jobRequest.idPhotoPath,
  };

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ groupId: jobRequest.groupId }, 'Create synthetic ID photo jobs');

    const inputs = genSyntheticIdPhotoData(jobRequest.parameters, userId, jobRequest.avatarId, idPhotoSet);

    const jobs: Job[] = inputs.map((input) => {
      const rawPath = input.imageGenerator.uploadPath as string;
      const dotIdx = rawPath.lastIndexOf('.');
      const thumbnailUploadPath = `${dotIdx >= 0 ? rawPath.slice(0, dotIdx) : rawPath}-thumbnail.jpg`;

      const thumbnailMaker: ThumbnailMaker = {
        mediaType: MediaTypes.image,
        mediaPath: rawPath,
        size: 400,
        service: Services.thumbnailMaker,
        status: JobStatuses.pending,
        uploadPath: thumbnailUploadPath,
      };

      return {
        userId,
        groupId: jobRequest.groupId,
        avatarId: jobRequest.avatarId,
        mediaType: MediaTypes.image,
        target: JobTargets.idPhoto,
        status: JobStatuses.pending,
        maxRuns: 3,
        curRun: 0,
        order: input.order,
        workflow: [input.imageGenerator, input.headDirectionChecker, thumbnailMaker],
        metadata: input.metadata,
        resultMediaPath: rawPath,
        resultThumbnailPath: thumbnailUploadPath,
      }
    })

    const dbJobs = await createManyDb(userId, jobs);
    await sendJobs(WORKFLOW_MANAGER_TOPIC, dbJobs, SERVICE_NAME);

    return res.status(201).json(dbJobs);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create synthetic ID photo jobs');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const genDigitalTwinIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;
  const imageId = uuid.v4();
  
  setLogContext(userId, jobRequest.avatarId);

  try {
    logger.info('Create digital twin ID photo job');

    const rmbgUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}.png`;
    const cropUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}-crop.png`;
    const thumbnailUploadPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images/${imageId}-thumbnail.jpg`;

    const cropper: Cropper = {
      service: Services.cropper,
      status: JobStatuses.pending,
      mediaPath: jobRequest.idPhotoPath!,
      mode: jobRequest.mode!,
      uploadPath: cropUploadPath,
    }

    const headDirectionChecker: HeadDirectionChecker = {
      service: Services.headDirectionChecker,
      status: JobStatuses.pending,
      imagePath: cropUploadPath,
      direction: jobRequest.direction!
    }

    const removeBackground: AiModelGateway = {
      service: Services.aiModelGateway,
      status: JobStatuses.pending,
      model: Models.birefNetV2,
      platform: Platforms.falai,
      imagePaths: [cropUploadPath],
      uploadPath: rmbgUploadPath
    }

    const thumbnailMaker: ThumbnailMaker = {
      mediaType: MediaTypes.image,
      mediaPath: rmbgUploadPath,
      size: 400,
      service: Services.thumbnailMaker,
      status: JobStatuses.pending,
      uploadPath: thumbnailUploadPath,
    };

    const job: Job = {
      userId,
      groupId: jobRequest.groupId,
      avatarId: jobRequest.avatarId,
      mediaType: MediaTypes.image,
      target: JobTargets.idPhoto,
      status: JobStatuses.pending,
      maxRuns: 1,
      curRun: 0,
      order: jobRequest.order,
      workflow: [cropper, headDirectionChecker, removeBackground, thumbnailMaker],
      metadata: {
        ratio: ImageRatios['1:1'],
        dimensions: '2048x2048',
      },
      resultMediaPath: rmbgUploadPath,
      resultThumbnailPath: thumbnailUploadPath,
    }

    const dbJob = await createDb(userId, job);
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, SERVICE_NAME);

    return res.status(201).json(dbJob);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create digital twin ID photo jobs');
    next(error);
  } finally {
    clearLogContext();
  }
};
