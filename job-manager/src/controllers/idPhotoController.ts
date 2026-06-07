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
  FaceMatcher,
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
    await sendJob(WORKFLOW_MANAGER_TOPIC, dbJob, 'job-manager');

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
    front: jobRequest.frontIdPhotoPath,
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
    await sendJobs(WORKFLOW_MANAGER_TOPIC, dbJobs, 'job-manager');

    return res.status(201).json(dbJobs);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create synthetic ID photo jobs');
    next(error);
  } finally {
    clearLogContext();
  }
};

export const genDigitalTwinIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;
  const groupId = uuid.v4();

  const avatarMediaPath = `media/${userId}-user/avatars/${jobRequest.avatarId}-avatar/images`;
  const idPhotoSet: IdPhotoSetPaths = {
    front: `${avatarMediaPath}/uploaded/front-cropped.png`,
    frontSmile: `${avatarMediaPath}/uploaded/front-smile-cropped.png`,
    rightQuarter: `${avatarMediaPath}/uploaded/right-quarter-cropped.png`,
    leftQuarter: `${avatarMediaPath}/uploaded/left-quarter-cropped.png`,
    rightSide: `${avatarMediaPath}/uploaded/right-side-cropped.png`,
    leftSide: `${avatarMediaPath}/uploaded/left-side-cropped.png`,
    body: `${avatarMediaPath}/uploaded/full-body-cropped.png`,
  };

  setLogContext(userId, jobRequest.avatarId);
  try {
    logger.info({ groupId }, 'Create digital twin ID photo jobs');

    const inputs = genDigitalTwinIdPhotoData(jobRequest.parameters, userId, jobRequest.avatarId, idPhotoSet);

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
        groupId: groupId,
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
    await sendJobs(WORKFLOW_MANAGER_TOPIC, dbJobs, 'job-manager');

    return res.status(201).json(dbJobs);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create digital twin ID photo jobs');
    next(error);
  } finally {
    clearLogContext();
  }
};
