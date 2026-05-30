import admin from 'firebase-admin';
import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.BUCKET_NAME,
});

import { HeadDirectionChecker, Job, JobStatuses, Services, WorkflowStep } from './types/job';
import { sendJob } from './services/messageQueue';
import { downloadMediaFromPath } from './services/storage';
import { checkDirection } from './utils/detector';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const WORKFLOW_MANAGER_TOPIC = process.env.WORKFLOW_MANAGER_TOPIC || 'workflow-manager';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for head direction jobs...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.service === Services.headDirectionChecker && step.status === JobStatuses.pending);

    if (stepIdx >= 0) {
      const stepData = job.workflow[stepIdx] as HeadDirectionChecker;

      message.ack();

      try {
        const image = await downloadMediaFromPath(stepData.imagePath);
        const passed = await checkDirection(image, stepData.direction);

        if (!passed) {
          logger.info(`Wrong head direction for job ${job.id}`);
          stepData.status = JobStatuses.error;
          stepData.error = 'wrong head direction';
        } else {
          logger.info(`Correct head direction for job ${job.id}`);
          stepData.status = JobStatuses.completed;
          job.workflow[stepIdx] = stepData;
        }

        await sendJob(WORKFLOW_MANAGER_TOPIC, job);
      } catch (error: any) {
        logger.error(`Head direction checker failed iwth error: ${error}`);

        stepData.status = JobStatuses.error;
        stepData.error = String(error);
        job.workflow[stepIdx] = stepData;

        await sendJob(WORKFLOW_MANAGER_TOPIC, job);
      }
    } else {
      logger.warn(`Head direction checker pending step is not found for job ${job.id}`);
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();