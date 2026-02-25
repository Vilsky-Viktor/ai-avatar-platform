import { getStorage } from 'firebase-admin/storage';
import logger from '../logger';

export const removeStoredMediaByPaths = async (mediaPaths: string[]): Promise<void> => {
  if (!mediaPaths || mediaPaths.length === 0) return;

  const bucket = getStorage().bucket();

  const deletionPromises = mediaPaths.map(async (path) => {
    try {
      const isFolder = path.endsWith('/');

      if (isFolder) {
        await bucket.deleteFiles({
          prefix: path,
          force: true
        });
        logger.info(`Successfully removed folder and contents: ${path}`);
      } else {
        await bucket.file(path).delete({ ignoreNotFound: true });
        logger.info(`Successfully removed file: ${path}`);
      }
    } catch (error: any) {
      logger.error(`Failed to remove media at ${path}: ${error.message}`);
    }
  });

  await Promise.all(deletionPromises);
};