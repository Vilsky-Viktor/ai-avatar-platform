import { PubSub } from '@google-cloud/pubsub';
import { Job } from '../types/job';
import logger from '../logger';

const pubsub = new PubSub({
  projectId: process.env.PROJECT_ID,
});

const SEND_JOBS_CHUNK_SIZE = 5;

export const sendJob = async (topicName: string, job: Job, serviceName: string): Promise<string> => {
    try {
        const topic = pubsub.topic(topicName);

        const messageId = await topic.publishMessage({
            data: Buffer.from(JSON.stringify(job)),
            attributes: {
                timestamp: new Date().toISOString(),
                service: serviceName,
            },
        });

        logger.info(`Message ${messageId} published successfully. Job: ${job.id}.`);
        return messageId;
    } catch (error: any) {
        logger.error(`Pub/Sub Publish Error: ${error.message}`);
        throw error;
    }
};

export const sendJobs = async (topicName: string, jobs: Job[], serviceName: string): Promise<void> => {
    for (let i = 0; i < jobs.length; i += SEND_JOBS_CHUNK_SIZE) {
        const chunk = jobs.slice(i, i + SEND_JOBS_CHUNK_SIZE);
        await Promise.all(chunk.map(job => sendJob(topicName, job, serviceName)));
    }
};
