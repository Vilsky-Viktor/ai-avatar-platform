import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { AudioGenerator, Job, JobStatuses, Models, Services, WorkflowStep } from './types/job';
import { genElevenV3 } from './services/aiModelGatewayService';
import { sendJob } from './services/messageQueue';
import { getJob } from './services/jobManagerService';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'video-generator-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for audio jobs...');

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

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.audioGenerator && step.status === JobStatuses.pending);

    if (stepIdx >= 0) {
      const stepData = job.workflow[stepIdx] as AudioGenerator;

      try {
        if (stepData.model === Models.eleven) {
          logger.info(`Using ElevenLabs Eleven V3 for job ${job.id}`);
          await genElevenV3(job.userId, stepData);
        } else {
          logger.warn(`Not supported model and flow`);
        }

        stepData.status = JobStatuses.completed;
        job.workflow[stepIdx] = stepData;

        await sendJob(WORKFLOW_MANAGER_TOPIC, job);
      } catch (error: any) {
        stepData.status = JobStatuses.error;
        stepData.error = String(error);
        job.workflow[stepIdx] = stepData;

        await sendJob(WORKFLOW_MANAGER_TOPIC, job);
      } 
    } else {
      logger.warn(`Audio generator pending step is not found for job ${job.id}`);
    }

    message.ack();
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();