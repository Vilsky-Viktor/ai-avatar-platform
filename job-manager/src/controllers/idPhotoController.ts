import { Request, Response, NextFunction } from 'express';
import {
  Job,
  MediaTypes,
  JobTargets,
  JobStatuses,
  IdPhotoJobRequest,
  Upscaler,
  HeadDirectionChecker,
  Models,
  Flows,
  Services,
} from '../types/job';
import { IdPhotoSetPaths } from '../types/idPhotoSet';
import { genDigitalTwinIdPhotoData, genSyntheticFrontIdPhtotoData, genSyntheticIdPhotoData } from '../utils/idPhotoInputData';
import {
  getByGroupId as getByGroupIdDb,
  create as createDb,
  createMany as createManyDb,
} from '../repositories/job';
import { publishJob, publishJobs } from '../services/messageQueue';
import uuid from 'uuid';


const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';


export const genSyntheticFrontIdPhoto = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;
  const groupId = uuid.v4();

  req.log.info(`Create synthetic front ID photo job for user ${userId} with group ID ${groupId}`);

  try {
    const input = genSyntheticFrontIdPhtotoData(jobRequest.parameters, userId, jobRequest.avatarId);

    const generatorUploadPath = input.imageGenerator.uploadPath!;
    const dotIndex = generatorUploadPath.lastIndexOf('.');
    const upscalerUploadPath = `${generatorUploadPath.slice(0, dotIndex)}-upscaled${generatorUploadPath.slice(dotIndex)}`;

    const upscaler: Upscaler = {
      service: Services.upscaler,
      imagePath: generatorUploadPath,
      uploadPath: upscalerUploadPath,
      status: JobStatuses.pending,
      model: Models.seedvr,
      flow: Flows.i2i,
    };

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
      workflow: [input.imageGenerator, upscaler],
      metadata: input.metadata,
      resultMediaPath: upscalerUploadPath
    }

    const dbJob = await createDb(userId, job);
    await publishJob(WORKFLOW_MANAGER_TOPIC, dbJob);

    return res.status(201).json(dbJob);
  } catch (error) {
    req.log.info(`Failed to create synthetic front ID photo job for ${userId}: ${error}`);
    next(error);
  }
};

export const genSyntheticIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;

  req.log.info(`Create synthetic ID photo jobs for user ${userId} with group ID ${jobRequest.groupId}`);

  const idPhotoSet: IdPhotoSetPaths = {
    front: jobRequest.frontIdPhotoPath,
  };

  try {
    const inputs = genSyntheticIdPhotoData(jobRequest.parameters, userId, jobRequest.avatarId, idPhotoSet);

    const jobs: Job[] = inputs.map((input) => {
      const generatorUploadPath = input.imageGenerator.uploadPath!;
      const dotIndex = generatorUploadPath.lastIndexOf('.');
      const upscalerUploadPath = `${generatorUploadPath.slice(0, dotIndex)}-upscaled${generatorUploadPath.slice(dotIndex)}`;

      const upscaler: Upscaler = {
        service: Services.upscaler,
        imagePath: generatorUploadPath,
        uploadPath: upscalerUploadPath,
        status: JobStatuses.pending,
        model: Models.seedvr,
        flow: Flows.i2i,
      };

      const headDirectionChecker: HeadDirectionChecker = {
        service: Services.headDirectionChecker,
        imagePath: generatorUploadPath,
        direction: input.direction,
        status: JobStatuses.pending,
        model: Models.buffaloL,
        flow: Flows.none
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
        workflow: [input.imageGenerator, headDirectionChecker, upscaler],
        metadata: input.metadata,
        resultMediaPath: upscalerUploadPath
      }
    })

    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(WORKFLOW_MANAGER_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create synthetic ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
};

export const genDigitalTwinIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const jobRequest: IdPhotoJobRequest = req.body;
  const groupId = uuid.v4();

  req.log.info(`Create twin ID photo jobs for user ${userId} with group ID ${groupId}`);

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

  try {
    const inputs = genDigitalTwinIdPhotoData(jobRequest.parameters, userId, jobRequest.avatarId, idPhotoSet);

    const jobs: Job[] = inputs.map((input) => {
      const generatorUploadPath = input.imageGenerator.uploadPath!;
      const dotIndex = generatorUploadPath.lastIndexOf('.');
      const upscalerUploadPath = `${generatorUploadPath.slice(0, dotIndex)}-upscaled${generatorUploadPath.slice(dotIndex)}`;

      const upscaler: Upscaler = {
        service: Services.upscaler,
        imagePath: generatorUploadPath,
        uploadPath: upscalerUploadPath,
        status: JobStatuses.pending,
        model: Models.seedvr,
        flow: Flows.i2i,
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
        workflow: [input.imageGenerator, upscaler],
        metadata: input.metadata,
        resultMediaPath: upscalerUploadPath
      }
    })
    
    const dbJobs = await createManyDb(userId, jobs);
    await publishJobs(WORKFLOW_MANAGER_TOPIC, dbJobs);

    return res.status(201).json(dbJobs);
  } catch (error) {
    req.log.info(`Failed to create twin ID photo jobs for ${userId}: ${error}`);
    next(error);
  }
};
