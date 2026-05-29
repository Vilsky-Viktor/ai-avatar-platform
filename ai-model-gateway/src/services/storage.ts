import { getStorage } from 'firebase-admin/storage';
import axios from 'axios';
import logger from '../logger';

export const getMediaUrlFromPath = async (mediaPath: string): Promise<string> => {
  const bucket = getStorage().bucket();

  try {
    const [url] = await bucket.file(mediaPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    return url;
  } catch (error: any) {
    logger.error(`Failed to get URL for ${mediaPath}: ${error.message}`);
    throw error;
  }
};

export const downloadResultFile = async (url: string): Promise<Buffer> => {
  logger.info(`Downloading result file from ${url}`);
  const response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
  logger.info(`Downloaded ${response.data.byteLength} bytes`);
  return Buffer.from(response.data);
};

export const uploadToBucket = async (file: Buffer, filePath: string): Promise<void> => {
  logger.info(`Uploading ${file.byteLength} bytes to ${filePath}`);
  const bucket = getStorage().bucket();
  await bucket.file(filePath).save(file);
  logger.info(`Uploaded to ${filePath}`);
};