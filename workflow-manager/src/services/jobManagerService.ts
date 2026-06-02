import { createServiceClient } from '../utils/serviceClient';
import { Job } from '../types/job';
import logger from '../logger';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const getJob = (job: Job): Promise<Job> =>
  client.get<Job>(`/get/id/${job.id}`, job.userId);

export const updateJob = async (job: Job): Promise<void> => {
  try {
    await client.patch(`/update/${job.id}`, job.userId, job);
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.warn({ jobId: job.id }, 'Job not found during update — it was likely deleted, skipping');
      return;
    }
    throw error;
  }
};
