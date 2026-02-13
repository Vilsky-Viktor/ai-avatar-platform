import { Request } from 'express';
import axios from 'axios';

const JOB_MANAGER_SERVICE_URL = process.env.JOB_MANAGER_SERVICE_URL;

export const deleteJobsByAvatarId = async (req: Request, userId: string, avatarId: string): Promise<void> => {
    try {
        const url = `${JOB_MANAGER_SERVICE_URL}/delete-by-avatar-id/${avatarId}`;

        await axios.delete(url, {
            headers: {
                'x-user-id': userId
            }
        });
    } catch (error: any) {
        req.log.error(`Failed to remove jobs by avatarId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};

export const deleteJobsByUserId = async (req: Request, userId: string): Promise<void> => {
    try {
        const url = `${JOB_MANAGER_SERVICE_URL}/delete-by-user-id/${userId}`;

        await axios.delete(url, {
            headers: {
                'x-user-id': userId
            }
        });
    } catch (error: any) {
        req.log.error(`Failed to remove jobs by userId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};