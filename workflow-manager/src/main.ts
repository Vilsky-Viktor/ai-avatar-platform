import { PubSub, Message } from '@google-cloud/pubsub';
import admin from 'firebase-admin';
import logger from './logger';
import { Job, JobStatuses, WorkflowStep } from './types/job';
import { updateJob, getJob } from './services/jobManagerService';
import { deleteBlob } from './services/storageService';
import { sendJob } from './services/messageQueue';

admin.initializeApp({ projectId: process.env.PROJECT_ID, storageBucket: process.env.BUCKET_NAME });

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'image-generator-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

const completedHandler = async (job: Job) => {
  logger.info(`Workflow successfully completed for job ${job.id}`)
  job.status = JobStatuses.completed;

  await updateJob(job);

  const intermediatePaths = job.workflow
    .map((step: WorkflowStep) => step.uploadPath)
    .filter((path): path is string => !!path && path !== job.resultMediaPath);

  if (intermediatePaths.length > 0) {
    logger.info({ jobId: job.id, paths: intermediatePaths }, 'Deleting intermediate files');
    await Promise.all(intermediatePaths.map(deleteBlob));
  }
}

const newWorkflowHandler = async (job: Job) => {
  logger.info(`Starting a new workflow for job ${job.id}`);
  const stepIdx = 0;
  const stepData = job.workflow[stepIdx];

  await sendJob(stepData.service, job);

  stepData.status = JobStatuses.generating;
  job.workflow[stepIdx] = stepData;
  job.status = JobStatuses.generating;

  await updateJob(job);
}

const pendingStepHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.pending);
  const stepData = job.workflow[stepIdx];

  await sendJob(stepData.service, job);

  stepData.status = JobStatuses.generating;
  job.workflow[stepIdx] = stepData;

  await updateJob(job);
}

const jobErrorHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
  const stepData = job.workflow[stepIdx];

  job.status = JobStatuses.error;

  logger.info(`Workflow failed after ${job.maxRuns} runs for job ${job.id}, model: ${stepData.model}, error: ${stepData.error}`);
  await updateJob(job);
}

const stepErrorHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
  const stepData = job.workflow[stepIdx];

  logger.info(`Restarting workflow due to job ${job.id}, model: ${stepData.model}, error: ${stepData.error}`);

  job.curRun += 1;
  job.workflow = job.workflow.map((step: WorkflowStep) => ({...step, status: JobStatuses.pending, error: '', operationJobId: undefined}));

  const firstStepIdx = 0;
  const firstStepData = job.workflow[firstStepIdx];

  await sendJob(firstStepData.service, job);

  job.workflow[firstStepIdx] = firstStepData;

  await updateJob(job);
}

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

    const allStepsCompleted = job.workflow.every((step: WorkflowStep) => step.status === JobStatuses.completed);
    const jobError = job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun === job.maxRuns;
    const stepError = job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun !== job.maxRuns;
    const newWorkflow = job.workflow.every((step: WorkflowStep) => step.status === JobStatuses.pending);
    const pendingStep = job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.pending);

    try {
      if (allStepsCompleted) {
        await completedHandler(job);
      } else if (jobError) {
        await jobErrorHandler(job);
      } else if (stepError) {
        await stepErrorHandler(job);
      } else if (newWorkflow) {
        await newWorkflowHandler(job);
      } else if (pendingStep) {
        await pendingStepHandler(job);
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