import { createServiceClient } from '../utils/serviceClient';
import { InferenceJob } from '../types/job';

const client = createServiceClient(process.env.MEDIA_URL);

export const createMediaFromJob = (userId: string, job: InferenceJob): Promise<void> =>
  client.post(`/create-from-job`, userId, job);
