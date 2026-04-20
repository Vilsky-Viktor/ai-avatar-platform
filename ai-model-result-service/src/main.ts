import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { updateJob } from './services/jobManagerService'
import { Job } from './types/job';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'ai-model-result-sub';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model results...');

  const messageHandler = async (message: Message) => {
    let job: Job | undefined;
    try {
      job = JSON.parse(message.data.toString()) as Job;

      logger.info({ jobId: job.id, status: job.status, msgId: message.id }, 'Received message');

      await updateJob(job);
      message.ack();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        logger.warn({ jobId: job?.id, msgId: message.id }, 'Job not found, skipping message');
        message.ack();
      } else {
        logger.error({ err }, 'Error parsing message or handling result');
        message.nack();
      }
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();