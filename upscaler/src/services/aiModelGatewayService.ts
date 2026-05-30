import { ImageGenerator, Upscaler } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AI_MODEL_GATEWAY_URL);

export const upscaleTopazImage = (userId: string, payload: Upscaler): Promise<void> =>
    client.post('/topaz/image/upscale', userId, payload);

export const upscaleTopazVideo = (userId: string, payload: Upscaler): Promise<void> =>
    client.post('/topaz/video/upscale', userId, payload);
