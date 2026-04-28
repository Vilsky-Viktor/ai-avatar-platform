import { getStorage } from 'firebase-admin/storage';
import logger from '../logger';

export const removeAvatarMediaFolder = async (userId: string, avatarId: string): Promise<void> => {
  const folderPath = `media/${userId}-user/avatars/${avatarId}-avatar/`

  const bucket = getStorage().bucket();

  try {
    await bucket.deleteFiles({
        prefix: folderPath,
        force: true
    });
    logger.info(`Successfully removed folder and contents: ${folderPath}`);
  } catch (error: any) {
    logger.error(`Failed to remove media at ${folderPath}: ${error.message}`);
  }
};