import { createServiceClient } from '@loom24/shared/services';
import logger from '@loom24/shared/logger';
import { Job } from '@loom24/shared/types';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const getJob = (job: Job): Promise<Job> =>
  client.get<Job>(`/get/job/${job.id}`, job.userId);

export const updateJob = async (job: Job): Promise<void> => {
  try {
    await client.patch(`/update/job/${job.id}`, job.userId, {
      status: job.status,
      workflow: job.workflow,
      curRun: job.curRun,
      metadata: job.metadata
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.warn({ jobId: job.id }, 'Job not found during update — it was likely deleted, skipping');
      return;
    }
    throw error;
  }
};
