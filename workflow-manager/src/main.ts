import { PubSub, Message } from '@google-cloud/pubsub';
import admin from 'firebase-admin';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import { sendJob } from '@loom24/shared/services';
import { AiModelGateway, Job, JobStatuses, MediaTypes, WorkflowStep, MAX_VIDEO_DURATION_SEC } from '@loom24/shared/types';
import { updateJob, getJob } from './services/jobManagerService';
import { deleteBlob } from './services/storageService';

admin.initializeApp({ projectId: process.env.PROJECT_ID, storageBucket: process.env.BUCKET_NAME });

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'workflow-manager-sub';
const MAX_CONCURRENT_MESSAGES = parseInt(process.env.MAX_CONCURRENT_MESSAGES || '10');
const SERVICE_NAME = process.env.SERVICE_NAME || 'workflow-manager'

const pubsub = new PubSub({ projectId: PROJECT_ID });

const removeIntermediatePaths = async (job: Job) => {
   try {
    const keep = new Set([job.resultMediaPath, job.resultThumbnailPath]);
    const intermediatePaths = job.workflow
      .map((step: WorkflowStep) => step.uploadPath)
      .filter((path): path is string => !!path && !keep.has(path));

    if (intermediatePaths.length > 0) {
      logger.info({ paths: intermediatePaths }, 'Deleting intermediate files');
      await Promise.all(intermediatePaths.map(deleteBlob));
    }
   } catch (error: any) {
    logger.error(`Did not manage to remove intermediate paths: ${error}`);
   }
}

const completedHandler = async (job: Job) => {
  logger.info({curRun: job.curRun}, 'Workflow successfully completed');
  job.status = JobStatuses.completed;

  await updateJob(job);
  await removeIntermediatePaths(job);
}

const newWorkflowHandler = async (job: Job) => {
  job.curRun += 1;
  job.status = JobStatuses.generating;

  logger.info({curRun: job.curRun}, 'Starting a new workflow');

  const stepIdx = 0;
  const stepData = job.workflow[stepIdx];

  await sendJob(stepData.service, job, SERVICE_NAME);

  stepData.status = JobStatuses.generating;
  job.workflow[stepIdx] = stepData;
  
  await updateJob(job);
}

const pendingStepHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.pending);
  const stepData = job.workflow[stepIdx];

  if (job.mediaType === MediaTypes.video && job.metadata?.durationSec && 'duration' in stepData) {
    stepData.duration = Math.min(job.metadata.durationSec, MAX_VIDEO_DURATION_SEC);
  }

  logger.info({curRun: job.curRun}, `Sending job to ${stepData.service} step`)

  job.status = JobStatuses.generating;

  await sendJob(stepData.service, job, SERVICE_NAME);

  stepData.status = JobStatuses.generating;
  job.workflow[stepIdx] = stepData;

  await updateJob(job);
}

const jobErrorHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
  const stepData = job.workflow[stepIdx];

  job.status = JobStatuses.error;

  logger.info({ model: stepData.model, error: stepData.error, curRun: job.curRun, maxRuns: job.maxRuns }, 'Workflow failed — max runs exhausted');
  await updateJob(job);
}

const stepErrorHandler = async (job: Job) => {
  const stepIdx = job.workflow.findIndex((step: WorkflowStep) => step.status === JobStatuses.error);
  const stepData = job.workflow[stepIdx];

  job.curRun += 1;
  job.workflow = job.workflow.map((step: WorkflowStep) => ({...step, status: JobStatuses.pending, error: undefined}));

  logger.info({ model: stepData.model, error: stepData.error, curRun: job.curRun }, 'Restarting workflow');

  await sendJob(job.workflow[0].service, job, SERVICE_NAME);

  await updateJob(job);
}

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID, {
    flowControl: { maxMessages: MAX_CONCURRENT_MESSAGES },
  });

  logger.info({ service: SERVICE_NAME, subscription: SUBSCRIPTION_ID }, 'Listening');

  const messageHandler = async (message: Message) => {
    let job: Job;
    try {
      job = JSON.parse(message.data.toString()) as Job;
    } catch (error) {
      logger.error({ err: error }, 'Failed to parse message — acking to prevent redelivery');
      message.ack();
      return;
    }

    setLogContext(job.userId, job.avatarId, job.id);

    try {
      logger.info({ msgId: message.id }, 'Received message');

      try {
        const dbJob = await getJob(job);
        if (!dbJob || dbJob.status === JobStatuses.canceled) {
          logger.info('Job not found or canceled — skipping');
          message.ack();
          return;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          logger.info('Job not found — skipping');
          message.ack();
          return;
        }
        logger.error({ err: error }, 'Failed to fetch job from job manager — nacking for retry');
        message.nack();
        return;
      }

      const allStepsCompleted = job.workflow.every((step: WorkflowStep) => step.status === JobStatuses.completed);
      const jobError = job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun >= job.maxRuns;
      const stepError = job.workflow.some((step: WorkflowStep) => step.status === JobStatuses.error) && job.curRun < job.maxRuns;
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
          logger.warn('No workflow condition matched');
        }
      } catch (error: any) {
        logger.error({ err: error }, 'Failed to process job');
        job.status = JobStatuses.error;
        await updateJob(job);
      }
    } finally {
      message.ack();
      clearLogContext();
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();
