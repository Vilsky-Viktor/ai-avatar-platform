import { Job } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.JOB_MANAGER_SERVICE_URL);

export const getJobsByGroupId = (userId: string, groupId: string): Promise<Job[]> =>
  client.get<Job[]>(`/get/group/${groupId}`, userId);