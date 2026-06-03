import { VideoGenerator } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AI_MODEL_GATEWAY_URL);


export const genKling3V3Pro = (userId: string, payload: VideoGenerator): Promise<void> =>
    client.post('/kling/video/v3/pro/image-to-video', userId, payload);

export const genKling3V3ProMotionControl = (userId: string, payload: VideoGenerator): Promise<void> =>
    client.post('/kling/video/v3/pro/motion-control', userId, payload);