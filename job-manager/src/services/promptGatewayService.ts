import { createServiceClient } from '@loom24/shared/services';

const client = createServiceClient(process.env.PROMPT_GATEWAY_URL);

interface SelectIdPhotosResponse {
    prompt: string;
    result: {
        idPhotos: number[];
        direction: string;
        shotType: string;
    };
}

export const selectIdPhotos = (userId: string, prompt: string): Promise<SelectIdPhotosResponse> =>
    client.post<SelectIdPhotosResponse>('/prompt/select-id-photos', userId, { prompt });
