import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import sharp from 'sharp';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.BUCKET_NAME,
});

import { ImageResizer, Job, JobStatuses, WorkflowStep, Services } from '@loom24/shared/types';
import { sendJob, downloadFromPath, uploadToBucket } from '@loom24/shared/services';
import { getJob } from './services/jobManagerService';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-resizer-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');
const SERVICE_NAME = process.env.SERVICE_NAME || 'image-resizer';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function computeRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function listenForMessages() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ service: SERVICE_NAME, subscription: SUBSCRIPTION_ID }, 'Listening');

  const messageHandler = async (message: Message) => {
    let job: Job;
    try {
      job = JSON.parse(message.data.toString()) as Job;
    } catch (error) {
      logger.error({ err: error }, 'Failed to parse message');
      message.ack();
      return;
    }

    setLogContext(job.userId, job.avatarId, job.id);

    logger.info({ msgId: message.id }, 'Received message');

    try {
      const liveJob = await getJob(job);
      if (liveJob.status === JobStatuses.canceled) {
        logger.info('Job canceled — skipping');
        message.ack();
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info('Job not found — skipping');
        message.ack();
        return;
      }
      logger.error({ err: error }, 'Failed to fetch job from job manager');
      message.nack();
      return;
    }

    const stepIdx = job.workflow.findIndex(
      (step: WorkflowStep) =>
        step.service === Services.imageResizer && step.status === JobStatuses.pending,
    );

    if (stepIdx < 0) {
      logger.warn('No pending image-resizer step found — skipping');
      message.ack();
      return;
    }

    const stepData = job.workflow[stepIdx] as ImageResizer;

    try {
      logger.info({ mediaPath: stepData.mediaPath, width: stepData.width, height: stepData.height }, 'Resizing image');

      const imageBuffer = await downloadFromPath(stepData.mediaPath);

      const resized = await sharp(imageBuffer)
        .resize(stepData.width, stepData.height, { fit: 'fill', kernel: 'lanczos3' })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();

      await uploadToBucket(resized, stepData.uploadPath!);

      logger.info({ uploadPath: stepData.uploadPath }, 'Image resized and uploaded');

      stepData.status = JobStatuses.completed;
      job.metadata = {
        ...job.metadata,
        ratio: computeRatio(stepData.width, stepData.height),
        dimensions: `${stepData.width}x${stepData.height}`,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Image resizer failed');
      stepData.status = JobStatuses.error;
      stepData.error = String(error);
    }

    job.workflow[stepIdx] = stepData;
    await sendJob(WORKFLOW_MANAGER_TOPIC, job, SERVICE_NAME);
    message.ack();
    clearLogContext();
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub subscription error'));
}

listenForMessages();
