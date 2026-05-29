import { PubSub, Message } from '@google-cloud/pubsub';
import logger from './logger';
import { Job } from './types/job';

const PROJECT_ID = process.env.PROJECT_ID || 'loom24-mvp';
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || 'ai-model-result-sub';
const LORA_DEFAULT_FILENAME = process.env.LORA_DEFAULT_FILENAME || 'lora.safetensors';

const pubsub = new PubSub({ projectId: PROJECT_ID });

function listenForResults() {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  logger.info({ subscription: SUBSCRIPTION_ID }, 'Listening for AI model results...');

  const messageHandler = async (message: Message) => {
    let job: Job;
    try {
      job = JSON.parse(message.data.toString()) as Job;

      logger.info({ jobId: job.id, msgId: message.id }, 'Received message');

      

      message.ack();
    } catch (err: any) {
      
    }
  };

  subscription.on('message', messageHandler);
  subscription.on('error', (error) => logger.error({ error }, 'Pub/Sub Subscription Error'));
}

listenForResults();