import { createServiceClient } from '../utils/serviceClient';
import { Job } from '../types/job';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const getJob = (job: Job): Promise<Job> =>
  client.get<Job>(`/get/id/${job.id}`, job.userId);
