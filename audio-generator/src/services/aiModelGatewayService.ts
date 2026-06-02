import { AudioGenerator, ImageGenerator } from '../types/job';
import { createServiceClient } from '../utils/serviceClient';

const client = createServiceClient(process.env.AI_MODEL_GATEWAY_URL);


export const genElevenV3 = (userId: string, payload: AudioGenerator): Promise<void> =>
    client.post('/elevenlabs/tts/eleven/v3', userId, payload);