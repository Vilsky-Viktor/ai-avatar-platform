import axios from 'axios';
import logger from '../logger';
import { JobResult, JobStatuses } from '../types/job';

const JOB_MANAGER_SERVICE_URL = process.env.JOB_MANAGER_SERVICE_URL;

export const updateJob = async (userId: string, jobId: string, status: JobStatuses, numRuns: number, result: JobResult): Promise<void> => {
    try {
        const url = `${JOB_MANAGER_SERVICE_URL}/update/${jobId}`;

        await axios.patch(url, {status, numRuns, result}, {
            headers: {
                'x-user-id': userId
            }
        });
    } catch (error: any) {
        logger.error(`Failed to remove jobs by avatarId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};