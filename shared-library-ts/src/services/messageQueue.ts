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

const SEND_JOB_MAX_RETRIES = 3;
const SEND_JOB_RETRY_BASE_DELAY_MS = 500;

const sendJobWithRetry = async (topicName: string, job: Job, serviceName: string): Promise<void> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < SEND_JOB_MAX_RETRIES; attempt++) {
        try {
            await sendJob(topicName, job, serviceName);
            return;
        } catch (err) {
            lastError = err;
            if (attempt < SEND_JOB_MAX_RETRIES - 1) {
                const delay = SEND_JOB_RETRY_BASE_DELAY_MS * 2 ** attempt;
                logger.warn(`Pub/Sub publish attempt ${attempt + 1}/${SEND_JOB_MAX_RETRIES} failed for job ${job.id} — retrying in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

export const sendJobs = async (topicName: string, jobs: Job[], serviceName: string): Promise<void> => {
    const failures: Array<{ jobId: string; error: unknown }> = [];

    for (let i = 0; i < jobs.length; i += SEND_JOBS_CHUNK_SIZE) {
        const chunk = jobs.slice(i, i + SEND_JOBS_CHUNK_SIZE);
        const results = await Promise.allSettled(chunk.map(job => sendJobWithRetry(topicName, job, serviceName)));
        results.forEach((result, idx) => {
            if (result.status === 'rejected') {
                failures.push({ jobId: chunk[idx].id!, error: result.reason });
            }
        });
        if (failures.length > 0) break;
    }

    if (failures.length > 0) {
        const ids = failures.map(f => f.jobId).join(', ');
        logger.error({ failedJobIds: ids }, `Failed to publish ${failures.length} job(s) to ${topicName}`);
        throw new Error(`Failed to publish ${failures.length} job(s): ${ids}`);
    }
};
