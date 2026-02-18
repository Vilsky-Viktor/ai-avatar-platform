import { PubSub, Message } from '@google-cloud/pubsub';
import { AIModelResult } from './types/modelResult';
import logger from './logger';
import {updateJob} from './services/jobManagerService'

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'ai-model-result-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

async function handleModelResult(result: AIModelResult) {
  const { jobId, userId, status, resultPath, error } = result;

  if (error) {
    logger.error({ jobId, userId, error }, 'Updating job status');
    await updateJob(userId, jobId, status, {error});
    return;
  }

  logger.info({ jobId, userId, resultPath }, 'Updating job status');
  await updateJob(userId, jobId, status, {mediaPath: resultPath!});
}

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model results...');

  const messageHandler = async (message: Message) => {
    try {
      const result: AIModelResult = JSON.parse(message.data.toString());

      logger.info({ jobId: result.jobId, status: result.status, msgId: message.id }, 'Received message');

      await handleModelResult(result);
      message.ack();
    } catch (err) {
      logger.error({ err }, 'Error parsing message or handling result');
      message.nack();
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();