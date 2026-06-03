import { getStorage } from 'firebase-admin/storage';
import logger from '../logger';

const BUCKET_NAME = process.env.BUCKET_NAME || 'loom24-mvp.firebasestorage.app';

export const deleteBlob = async (blobPath: string): Promise<void> => {
  try {
    const bucket = getStorage().bucket(BUCKET_NAME);
    await bucket.file(blobPath).delete();
    logger.info(`Deleted intermediate blob: ${blobPath}`);
  } catch (error: any) {
    if (error?.code === 404) {
      logger.warn(`Intermediate blob not found (already deleted?): ${blobPath}`);
      return;
    }
    throw error;
  }
};
