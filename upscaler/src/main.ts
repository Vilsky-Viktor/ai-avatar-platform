import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Flows, ImageGenerator, Job, JobStatuses, Models, Services, Upscaler, WorkflowStep } from './types/job';
import { upscaleTopazImage, upscaleTopazVideo, upscaleSeedvrImage } from './services/aiModelGatewayService';
import { sendJob } from './services/messageQueue';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for upscale jobs...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.upscaler && step.status === JobStatuses.pending);

    if (stepIdx >= 0) {
      const stepData = job.workflow[stepIdx] as Upscaler;

      message.ack();

      try {
        if (stepData.model === Models.topaz && stepData.flow === Flows.i2i) {
          await upscaleTopazImage(job.userId, stepData);
        } else if (stepData.model === Models.topaz && stepData.flow === Flows.v2v) {
          await upscaleTopazVideo(job.userId, stepData);
        } else if (stepData.model === Models.seedvr && stepData.flow === Flows.i2i) {
          await upscaleSeedvrImage(job.userId, stepData);
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
      logger.warn(`Upscaler pending step is not found for job ${job.id}`);
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();