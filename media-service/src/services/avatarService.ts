import logger from '../logger';
import axios from 'axios';

const AVATAR_SERVICE_URL = process.env.AVATAR_SERVICE_URL;

export const updateCounterByFieldName = async (userId: string, avatarId: string, fieldName: string, amount: number): Promise<void> => {
    try {
        const url = `${AVATAR_SERVICE_URL}/update-counter-by-field-name/${avatarId}`;

        await axios.patch(url, { fieldName, amount }, { headers: {'x-user-id': userId }});
    } catch (error: any) {
        logger.error(`Failed to update avatar counter with status ${error.response?.status}: ${error.message}`)
        throw error;
    }
};
