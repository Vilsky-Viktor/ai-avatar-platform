import { PubSub } from '@google-cloud/pubsub';
import { Request } from 'express';
import { Job } from '../types/job';

const pubsub = new PubSub({
  projectId: process.env.PROJECT_ID
});

export const publishToTopic = async (req: Request, topicName: string, job: Job) => {
    try {
        const topic = pubsub.topic(topicName);

        const messageId = await topic.publishMessage({
            data: Buffer.from(JSON.stringify(job)),
            attributes: {
                timestamp: new Date().toISOString(),
                service: 'avatar-manager',
            }
        });

        req.log.info(`Message ${messageId} published successfully. Job: ${job.id}.`);
        return messageId;
    } catch (error: any) {
        req.log.error(`Pub/Sub Publish Error: ${error.message}`);
        throw error;
    }
};