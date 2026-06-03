import { VideoGenerator } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AI_MODEL_GATEWAY_URL);


export const genLipSyncV3 = (userId: string, payload: VideoGenerator): Promise<void> =>
    client.post('/sync-lipsync/v3', userId, payload);