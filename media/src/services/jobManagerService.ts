import { InferenceJob } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.JOB_MANAGER_URL);

export const getJobsByGroupId = (userId: string, groupId: string): Promise<InferenceJob[]> =>
    client.get<InferenceJob[]>(`/get/group/${groupId}`, userId);
