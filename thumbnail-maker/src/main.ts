import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.BUCKET_NAME,
});

import { ThumbnailMaker, Job, JobStatuses, WorkflowStep, Services, MediaTypes } from '@loom24/shared/types';
import { sendJob, downloadFromPath, uploadToBucket } from '@loom24/shared/services';
import { getJob } from './services/jobManagerService';
import { resizeImage, makeThumbnailFromVideo } from './utils/thumbnail';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'thumbnail-maker-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');
const SERVICE_NAME = process.env.SERVICE_NAME || 'thumbnail-maker';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
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
      (step: WorkflowStep) => step.service === Services.thumbnailMaker && step.status === JobStatuses.pending,
    );

    if (stepIdx < 0) {
      logger.warn('No pending thumbnail-maker step found');
      message.ack();
      return;
    }

    const stepData = job.workflow[stepIdx] as ThumbnailMaker;

    try {
      if (!stepData.uploadPath) {
        throw new Error('Missing uploadPath in workflow step');
      }

      let thumbnail: Buffer;

      logger.info({ mediaPath: stepData.mediaPath, mediaType: stepData.mediaType }, 'Downloading source media');
      const source = await downloadFromPath(stepData.mediaPath);

      if (stepData.mediaType === MediaTypes.image) {
        thumbnail = await resizeImage(source, stepData.size);
      } else {
        thumbnail = await makeThumbnailFromVideo(source, stepData.size);
      }

      logger.info({ uploadPath: stepData.uploadPath, bytes: thumbnail.byteLength }, 'Uploading thumbnail');
      await uploadToBucket(thumbnail, stepData.uploadPath!);

      stepData.status = JobStatuses.completed;
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job, SERVICE_NAME);
      logger.info('Thumbnail created successfully');
    } catch (error: any) {
      logger.error({ err: error }, 'Thumbnail generation failed');

      stepData.status = JobStatuses.error;
      stepData.error = String(error);
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job, SERVICE_NAME);
    } finally {
      message.ack();
      clearLogContext();
    }

  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();
