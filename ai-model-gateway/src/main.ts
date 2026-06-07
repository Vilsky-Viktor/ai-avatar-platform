import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
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

import { sendJob, uploadToBucket } from '@loom24/shared/services';
import { getJob } from './services/jobManagerService';
import { AiModelGateway, Job, JobStatuses, MediaTypes, Services, WorkflowStep } from '@loom24/shared/types';
import { generate } from './controllers/generatorController';

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
    let job: Job;
    
    try {
      job = JSON.parse(message.data.toString()) as Job;
    } catch (error) {
      logger.error({ msgId: message.id, err: error }, 'Failed to parse message — skipping');
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

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.aiModelGateway && step.status === JobStatuses.pending);

    if (stepIdx < 0) {
      logger.warn('No pending ai-model-gateway step found — skipping');
      message.ack();
      return;
    }

    const stepData = job.workflow[stepIdx] as AiModelGateway;

    const heartbeat = setInterval(() => {
        message.modAck(600);
        logger.info('Extended ack deadline');
      }, 300_000);

    try {
      logger.info({ platform: stepData.platform, model: stepData.model }, 'Starting generation');

      const result = await generate(stepData);

      if (!stepData.uploadPath) throw new Error('uploadPath missing on step');
      const uploadData = result.type === MediaTypes.text ? Buffer.from(result.data) : result.data as Buffer;
      await uploadToBucket(uploadData, stepData.uploadPath);

      stepData.status = JobStatuses.completed;
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job, 'ai-model-gateway');
    } catch (error: any) {
      logger.error({ err: error }, 'ai-model-gateway generation failed');

      stepData.status = JobStatuses.error;
      stepData.error = String(error);

      job.curRun = job.maxRuns;
      job.workflow[stepIdx] = stepData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job, 'ai-model-gateway');
    } finally {
      message.ack();
      clearInterval(heartbeat);
      clearLogContext();
    }
  }

  subscription.on('message', messageHandler);
  subscription.on('error', (error: any) => logger.error({ err: error }, 'Pub/Sub Subscription Error'));
}

listenForResults();


