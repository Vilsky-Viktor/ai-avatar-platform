import axios from 'axios';
import retry from 'async-retry';
import logger from '../logger';
import { UpsampledPrompt } from '../types/prompt';

const PROMPT_UPSAMPLER_SERVICE_URL = process.env.PROMPT_UPSAMPLER_SERVICE_URL;

export const upsample = async (prompt: string, imagePaths: string[], promptModel: string, targetModel: string, action: string): Promise<UpsampledPrompt> => {
    return retry(async (bail: Function) => {
        try {
            const url = `${PROMPT_UPSAMPLER_SERVICE_URL}/upsample`;
            const request = { prompt, imagePaths, promptModel, targetModel, action };
            const response = await axios.post(url, request);
            return response.data as UpsampledPrompt;
        } catch (error: any) {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                bail(error);
                throw error;
            }
            logger.error(`Upsample attempt failed: ${error.message}`);
            throw error;
        }
    }, {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onRetry: (error: any, attempt: number) => {
            logger.warn(`Retrying upsample attempt ${attempt}: ${error.message}`);
        }
    });
};