import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Job, JobStatuses, Workflow } from './types/job';
import { sendJob } from './services/messageQueue';
import { updateJob } from './services/jobManagerService';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model results...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    message.ack();

    try {
      if (job.workflow.every((step: Workflow) => step.status === JobStatuses.pending)) {
        const topic = job.workflow[0].service;

        job.curRun += 1;
        
        await sendJob(topic, job);
      } else if (job.workflow.some((step: Workflow) => step.status === JobStatuses.error) && job.curRun !== job.maxRuns) {
        const topic = job.workflow[0].service;

        job.curRun += 1;

        job.workflow = job.workflow.map((step: Workflow) => ({...step, status: JobStatuses.pending, error: ''}));

        await sendJob(topic, job);
      } else if (job.workflow.some((step: Workflow) => step.status === JobStatuses.error) && job.curRun === job.maxRuns) {
        job.status = JobStatuses.error;
        
        await updateJob(job);
      } else if (job.workflow.every((step: Workflow) => step.status === JobStatuses.completed)) {
        job.status = JobStatuses.completed;

        await updateJob(job);
      } else if (job.workflow.some((step: Workflow) => step.status === JobStatuses.pending)) {
        const pendingStepIdx = job.workflow.findIndex((step: Workflow) => step.status === JobStatuses.pending);
        const pendingStepData = job.workflow[pendingStepIdx];
        const topic = pendingStepData.service;

        await sendJob(topic, job);
      } else {
        logger.warn(`None of conditions met for job ${job.id}`)
      }
    } catch (error: any) {
      job.status = JobStatuses.error;
      await updateJob(job);
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();