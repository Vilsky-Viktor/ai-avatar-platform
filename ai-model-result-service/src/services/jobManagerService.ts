import { createServiceClient } from '../utils/serviceClient';
import { Job } from '../types/job';

const client = createServiceClient(process.env.JOB_MANAGER_SERVICE_URL);

export const updateJob = (job: Job): Promise<void> =>
  client.patch(`/update/${job.id}`, job.userId, { status: job.status, result: job.result });
