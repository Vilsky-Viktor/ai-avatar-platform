import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import falAi from './services/falAi';
import google from './services/google';

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.BUCKET_NAME,
});

falAi.authenticate().catch((err) => {
    logger.error({ err }, 'Failed to authenticate fal.ai');
    process.exit(1);
});

google.authenticate().catch((err) => {
    logger.error({ err }, 'Failed to authenticate Google AI Studio');
    process.exit(1);
});

import { sendJob } from './services/messageQueue';
import { getJob } from './services/jobManagerService';
import { AiModelGateway, Job, JobStatuses, MediaTypes, Services, WorkflowStep } from './types/job';
import { generate } from './controllers/generatorController';
import { uploadToBucket } from './services/storage';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'ai-model-gateway-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model jobs...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    try {
      const liveJob = await getJob(job);
      if (liveJob.status === JobStatuses.canceled) {
        logger.info({ jobId: job.id }, 'Job canceled — skipping');
        message.ack();
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info({ jobId: job.id }, 'Job not found — skipping');
        message.ack();
        return;
      }
      throw error;
    }

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.aiModelGateway && step.status === JobStatuses.pending);

    if (stepIdx < 0) {
      logger.warn(`Head direction checker pending step is not found for job ${job.id}`);
      return;
    }

    const stepData = job.workflow[stepIdx] as AiModelGateway;

    const heartbeat = setInterval(() => {
        message.modAck(600);
        logger.info({ jobId: job.id }, 'Extended ack deadline');
      }, 500_000);

    try {
      logger.info(`Using ${stepData.platform} ${stepData.model} for job ${job.id}`)

      const result = await generate(stepData);

      const uploadData = result.type === MediaTypes.text ? Buffer.from(result.data) : result.data as Buffer;
      await uploadToBucket(uploadData, stepData.uploadPath!);

      stepData.status = JobStatuses.completed;
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job);
    } catch (error: any) {
      logger.error(`Head direction checker failed iwth error: ${error}`);

      stepData.status = JobStatuses.error;
      stepData.error = String(error);
      
      job.curRun = job.maxRuns;
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job);
    } finally {
      clearInterval(heartbeat);
      message.ack();
    }
  }

  subscription.on('message', messageHandler);
  subscription.on('error', (error: any) => logger.error({ err: error }, 'Pub/Sub Subscription Error'));
}

listenForResults();


