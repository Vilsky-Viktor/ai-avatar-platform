import { Request, Response, NextFunction } from 'express';
import {
  InferenceJob,
  MediaTypes,
  JobTargets,
  JobStatuses,
  PhotoJobRequest,
  InferenceJobMetadata,
} from '../types/job';
import { AVATAR_REFERENCE_NAME } from '../utils/photoSetCaptions';
import { getAvatarIdPhotos as getAvatarIdPhotosDb, create as createDb } from '../repositories/job';
import { publishJob } from '../services/messageQueue';
import { getAvatarById } from '../services/avatarService';
import uuid from 'uuid';
import imageRatios from '../types/imageRatios';

const GEN_QWEN_EDIT_2511_TOPIC = process.env.GEN_QWEN_EDIT_2511_TOPIC || 'gen-qwen-edit-2511';

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
    const idPhotos = idPhotoJobs
      .filter(job => [1, 2, 3, 4, 5, 6].includes(job.order!))
      .map((job: InferenceJob) => job.result?.mediaPath!);

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
          { path: 'models/qwen-edit-2511/loras/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors', scale: 0.5 },
          { path: avatar.loras.qwenEdit2511.path, scale: 1.0, filename: avatar.loras.qwenEdit2511.filename },
        ],
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
};
