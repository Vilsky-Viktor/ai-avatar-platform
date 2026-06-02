import { ImageGenerator } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AI_MODEL_GATEWAY_URL);

export const genQwenImage2512 = (userId: string, payload: ImageGenerator): Promise<void> =>
    client.post('/qwen/image/2512', userId, payload);

export const genQwenImageEdit2511 = (userId: string, payload: ImageGenerator): Promise<void> =>
    client.post('/qwen/image/edit/2511', userId, payload);

export const genQwenImageEdit2511MultipleAngles = (userId: string, payload: ImageGenerator): Promise<void> =>
    client.post('/qwen/image/edit/2511/multiple-angles', userId, payload);

export const genFluxV2ProEdit = (userId: string, payload: ImageGenerator): Promise<void> =>
    client.post('/flux/v2/pro/edit', userId, payload);

export const genGoogleImage3Pro = (userId: string, payload: ImageGenerator): Promise<void> =>
    client.post('/google/image/3/pro', userId, payload);