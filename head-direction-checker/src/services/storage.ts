import { getStorage } from 'firebase-admin/storage';
import logger from '../logger';

export const downloadMediaFromPath = async (path: string): Promise<Buffer> => {
  logger.info(`Downloading media file from ${path}`);
  const bucket = getStorage().bucket();
  const [contents] = await bucket.file(path).download();
  logger.info(`Downloaded ${contents.byteLength} bytes from ${path}`);
  return contents;
};
