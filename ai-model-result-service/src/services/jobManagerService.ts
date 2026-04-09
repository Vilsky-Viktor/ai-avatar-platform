import axios from 'axios';
import logger from '../logger';
import { Job } from '../types/job';

const JOB_MANAGER_SERVICE_URL = process.env.JOB_MANAGER_SERVICE_URL;

export const updateJob = async (job: Job): Promise<void> => {
    try {
        const url = `${JOB_MANAGER_SERVICE_URL}/update/${job.id}`;

        await axios.patch(url, {status: job.status, result: job.result}, {
            headers: {
                'x-user-id': job.userId
            }
        });
    } catch (error: any) {
        logger.error(`Failed to remove jobs by avatarId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};