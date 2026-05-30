import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Flows, ImageGenerator, Job, JobStatuses, Models, Services, WorkflowStep } from './types/job';
import { upscaleTopazImage, upscaleTopazVideo } from './services/aiModelGatewayService';
import { sendJob } from './services/messageQueue';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for upscale jobs...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    const upscalerIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.upscaler && step.status === JobStatuses.pending);

    if (upscalerIdx >= 0) {
      const upscalerData = job.workflow[upscalerIdx] as ImageGenerator;

      message.ack();

      try {
        if (upscalerData.model === Models.topaz && upscalerData.flow === Flows.i2i) {
          await upscaleTopazImage(job.userId, upscalerData);
        } else if (upscalerData.model === Models.topaz && upscalerData.flow === Flows.v2v) {
          await upscaleTopazVideo(job.userId, upscalerData);
        } else {
          logger.warn(`Not supported model and flow`);
        }

        upscalerData.status = JobStatuses.completed;
        job.workflow[upscalerIdx] = upscalerData;

        await sendJob(WORKFLOW_MANAGER_TOPIC, job);
      } catch (error: any) {
        upscalerData.status = JobStatuses.error;
        upscalerData.error = String(error);
        job.workflow[upscalerIdx] = upscalerData;

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