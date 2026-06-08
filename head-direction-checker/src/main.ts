import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.BUCKET_NAME,
});

import { HeadDirectionChecker, Job, JobStatuses, WorkflowStep, Services } from '@loom24/shared/types';
import { sendJob, downloadFromPath } from '@loom24/shared/services';
import { getJob } from './services/jobManagerService';
import { checkDirection } from './utils/detector';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'head-direction-checker-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');
const SERVICE_NAME = process.env.SERVICE_NAME || 'head-direction-checker';

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

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.headDirectionChecker && step.status === JobStatuses.pending);

    if (stepIdx < 0) {
      logger.warn('No pending head-direction-checker step found — skipping');
      message.ack();
      return;
    }

    const stepData = job.workflow[stepIdx] as HeadDirectionChecker;

    try {
      const image = await downloadFromPath(stepData.imagePath);
      const passed = await checkDirection(image, stepData.direction);

      if (!passed) {
        logger.info('Wrong head direction');
        stepData.status = JobStatuses.error;
        stepData.error = 'wrong head direction';
      } else {
        logger.info('Correct head direction');
        stepData.status = JobStatuses.completed;
      }
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job, SERVICE_NAME);
    } catch (error: any) {
      logger.error({ err: error }, 'Head direction checker failed');

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