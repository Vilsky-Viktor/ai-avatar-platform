import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Job, JobStatuses, WorkflowStep } from './types/job';
import { sendJob } from './services/messageQueue';
import { updateJob, getJob } from './services/jobManagerService';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for workflow updates...');

  const messageHandler = async (message: Message) => {
    const job = JSON.parse(message.data.toString()) as Job;

    logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

    message.ack();

    try {
      const dbJob = await getJob(job);
      if (!dbJob || dbJob.status === JobStatuses.canceled) {
        logger.info({ jobId: job.id }, 'Job not found or canceled — skipping');
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info({ jobId: job.id }, 'Job not found — skipping');
        return;
      }
      throw error;
    }

    try {
      if (job.workflow.every((step: WorkflowStep) => step.status === JobStatuses.pending)) {
        logger.info(`Starting a new workflow for job ${job.id}`);
        const topic = job.workflow[0].service;

        job.status = JobStatuses.generating;
        job.curRun += 1;
        
        await sendJob(topic, job);
        await updateJob(job);
      } else if (job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun !== job.maxRuns) {
        const topic = job.workflow[0].service;
        const errorStepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
        const errorStepData = job.workflow[errorStepIdx];

        logger.info(`Restarting workflow due to job ${job.id}, step: ${errorStepData.service}, error: ${errorStepData.error}`);

        job.curRun += 1;
        job.workflow = job.workflow.map((step: WorkflowStep) => ({...step, status: JobStatuses.pending, error: ''}));

        await sendJob(topic, job);
        await updateJob(job);
      } else if (job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun === job.maxRuns) {
        const errorStepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
        const errorStepData = job.workflow[errorStepIdx];

        logger.info(`Workflow failed after ${job.maxRuns} runs for job ${job.id}, step: ${errorStepData.service}, error: ${errorStepData.error}`);

        job.status = JobStatuses.error;
        
        await updateJob(job);
      } else if (job.workflow.every((step: WorkflowStep) => step.status === JobStatuses.completed)) {
        logger.info(`Workflow successfully completed for job ${job.id}`)
        job.status = JobStatuses.completed;

        await updateJob(job);
      } else if (job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.pending)) {
        const pendingStepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.pending);
        const pendingStepData = job.workflow[pendingStepIdx];
        const topic = pendingStepData.service;

        logger.info(`Sending job ${job.id} to the next step ${topic}`);

        await sendJob(topic, job);
        await updateJob(job);
      } else {
        logger.warn(`None of conditions met for job ${job.id}`)
      }
    } catch (error: any) {
      logger.error(`Failed to process job ${job.id} with error: ${error}`);
      job.status = JobStatuses.error;
      await updateJob(job);
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();