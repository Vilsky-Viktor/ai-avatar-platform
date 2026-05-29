import { createServiceClient } from '../utils/serviceClient';
import { Job } from '../types/job';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const updateJob = (job: Job): Promise<void> =>
  client.patch(`/update/${job.id}`, job.userId, job);