import { PubSub } from '@google-cloud/pubsub';
import { Job } from '../types/job';
import logger from '../logger';

const pubsub = new PubSub({
  projectId: process.env.PROJECT_ID
});

export const sendJob = async (topicName: string, job: Job) => {
    try {
        const topic = pubsub.topic(topicName);

        const messageId = await topic.publishMessage({
            data: Buffer.from(JSON.stringify(job)),
            attributes: {
                timestamp: new Date().toISOString(),
                service: 'workflow-manager',
            }
        });

        logger.info(`Message ${messageId} published successfully. Job: ${job.id}.`);
        return messageId;
    } catch (error: any) {
        logger.error(`Pub/Sub Publish Error: ${error.message}`);
        throw error;
    }
};