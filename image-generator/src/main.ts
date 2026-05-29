import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { ImageGenerator, Job, JobStatuses, Workflow } from './types/job';
import { genQwenImage2512, genQwenImageEdit2511, genQwenImageEdit2511MultipleAngles, genFluxV2ProEdit } from './services/aiModelGatewayService';
import { sendJob } from './services/messageQueue';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model results...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    const imageGeneratorIdx = job.workflow.findIndex((step: Workflow) => step.service === 'image-generator');
    const imageGeneratorData = job.workflow[imageGeneratorIdx] as ImageGenerator;

    message.ack();

    try {
      if (!imageGeneratorData.imagePaths || imageGeneratorData.imagePaths.length === 0) {
        await genQwenImage2512(job.userId, imageGeneratorData);
      } else if (imageGeneratorData.horizontalAngle || imageGeneratorData.verticalAngle || imageGeneratorData.zoom) {
        await genQwenImageEdit2511MultipleAngles(job.userId, imageGeneratorData);
      } else if (imageGeneratorData.safetyTolerance) {
        await genFluxV2ProEdit(job.userId, imageGeneratorData);
      } else {
        await genQwenImageEdit2511(job.userId, imageGeneratorData);
      }

      imageGeneratorData.status = JobStatuses.completed;
      job.workflow[imageGeneratorIdx] = imageGeneratorData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job);
    } catch (error: any) {
      imageGeneratorData.status = JobStatuses.error;
      imageGeneratorData.error = String(error);
      job.workflow[imageGeneratorIdx] = imageGeneratorData;

      await sendJob(WORKFLOW_MANAGER_TOPIC, job);
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();