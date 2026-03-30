import { getStorage } from 'firebase-admin/storage';
import logger from '../logger';

export const downloadFiles = async (paths: string[]): Promise<Buffer[]> => {
    const bucket = getStorage().bucket();
    
    const downloads = paths.map(async (path) => {
        try {
            const file = bucket.file(path);
            const [buffer] = await file.download();
            logger.info(`Downloaded file: ${path} (${buffer.length} bytes)`);
            return buffer;
        } catch (error: any) {
            logger.error(`Failed to download file: ${path}. Error: ${error}`);
            throw error;
        }
    });

    return Promise.all(downloads);
};