import axios from 'axios';
import logger from '../logger';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL;

export const deleteMediaByAvatarId = async (userId: string, avatarId: string): Promise<void> => {
    try {
        const url = `${MEDIA_SERVICE_URL}/delete-by-avatar-id/${avatarId}`;

        await axios.delete(url, {
            headers: {
                'x-user-id': userId
            }
        });
    } catch (error: any) {
        logger.error(`Failed to remove media by avatarId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};

export const deleteMediaByUserId = async (userId: string): Promise<void> => {
    try {
        const url = `${MEDIA_SERVICE_URL}/delete-by-user-id/${userId}`;

        await axios.delete(url, {
            headers: {
                'x-user-id': userId
            }
        });
    } catch (error: any) {
        logger.error(`Failed to remove media by userId with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};