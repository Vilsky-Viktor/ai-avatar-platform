import { createServiceClient } from '@loom24/shared/services';
import { Job } from '@loom24/shared/types';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const getJob = (job: Job): Promise<Job> =>
  client.get<Job>(`/get/id/${job.id}`, job.userId);
