import axios from 'axios';
import retry from 'async-retry';
import logger from '../logger';
import { LlmResponse } from '../types/llmResponse';

const LLM_REQUEST_SERVICE_URL = process.env.LLM_REQUEST_SERVICE_URL;

export const getPersonCharacteristics = async (imagePaths: string[]): Promise<LlmResponse> => {
    return retry(async (bail: Function) => {
        try {
            const url = `${LLM_REQUEST_SERVICE_URL}/get-person-characteristics`;
            const request = { imagePaths };
            const response = await axios.post(url, request);
            return response.data as LlmResponse;
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