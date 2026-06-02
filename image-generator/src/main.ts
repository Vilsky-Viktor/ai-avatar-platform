import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Flows, ImageGenerator, Job, JobStatuses, Models, Services, WorkflowStep } from './types/job';
import { genQwenImage2512, genQwenImageEdit2511, genQwenImageEdit2511MultipleAngles, genFluxV2ProEdit, genGoogleImage3Pro } from './services/aiModelGatewayService';
import { sendJob } from './services/messageQueue';
import { getJob } from './services/jobManagerService';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for image jobs...');

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

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.imageGenerator && step.status === JobStatuses.pending);

    if (stepIdx >= 0) {
      const stepData = job.workflow[stepIdx] as ImageGenerator;

      try {
        if (stepData.model === Models.qwen && stepData.flow === Flows.t2i) {
          logger.info(`Using qwen image 2512 for job ${job.id}`);
          await genQwenImage2512(job.userId, stepData);
        } else if (stepData.model === Models.qwen && stepData.flow === Flows.ia2i) {
          logger.info(`Using qwen image edit 2511 multiple angles for job ${job.id}`);
          await genQwenImageEdit2511MultipleAngles(job.userId, stepData);
        } else if (stepData.model === Models.flux && stepData.flow === Flows.ti2i) {
          logger.info(`Using flux 2 pro edit for job ${job.id}`);
          await genFluxV2ProEdit(job.userId, stepData);
        } else if (stepData.model === Models.qwen && stepData.flow === Flows.ti2i) {
          logger.info(`Using qwen image edit 2511 for job ${job.id}`);
          await genQwenImageEdit2511(job.userId, stepData);
        } else if (stepData.model === Models.googleImage3Pro) {
          logger.info(`Using Google Image 3 Pro for job ${job.id}`);
          await genGoogleImage3Pro(job.userId, stepData);
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
      logger.warn(`Image generator pending step is not found for job ${job.id}`);
    }

    message.ack();
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();