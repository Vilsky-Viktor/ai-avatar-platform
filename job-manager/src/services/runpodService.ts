import axios from 'axios';
import logger from '../logger';
import { Job } from '../types/job';

const RUNPOD_URL = process.env.RUNPOD_URL;

export const createPod = async (job: Job): Promise<void> => {
    try {
        const url = `${RUNPOD_URL}/create-pod`;

        await axios.post(url, job);
    } catch (error: any) {
        logger.error(`Failed to create Runpod pod: ${error.message}`)
        throw error;
    }
};