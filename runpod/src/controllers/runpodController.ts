import { Request, Response, NextFunction } from 'express';
import { Job, JobTypes } from '../types/job';
import { getPods as getPodsService, createPod as createPodService } from '../services/runpodService';

const REGION = process.env.REGION || 'EUR-IS-1';
const NETWORK_VOLUME_ID = process.env.NETWORK_VOLUME_ID || '';
const TEXT_IMAGE_TO_IMAGE_TEMPLATE_ID = process.env.TEXT_IMAGE_TO_IMAGE_TEMPLATE_ID || '';

export const createPod = async (req: Request, res: Response, next: NextFunction) => {
  const job: Job = req.body;

  req.log.info(`Create Runpod instance if needed for job ${job.id}`);

  try {
    let podName: string;
    let templateId: string;
    if ([JobTypes.idPhoto, JobTypes.photoSet, JobTypes.text2image, JobTypes.textImage2image].includes(job.type)) {
      podName = 'text_image_to_image';
      templateId = TEXT_IMAGE_TO_IMAGE_TEMPLATE_ID!;
    } else {
      podName = 'text_image_to_video';
      templateId = '';
    }

    req.log.info('Getting existing pods');
    const pods = await getPodsService(podName);

    if (pods.length === 0) {
      req.log.info('Creating a new pod')
      await createPodService(podName, REGION, NETWORK_VOLUME_ID, templateId)
    }

    return res.status(201).json({result: 'ok'});
  } catch (error) {
    req.log.info(`Failed to create Runpod instance for job ${job.id}: ${error}`);
    next(error);
  }
};

