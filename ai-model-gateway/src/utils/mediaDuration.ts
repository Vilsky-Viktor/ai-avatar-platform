import { parseBuffer } from 'music-metadata';

export const getMediaDuration = async (buffer: Buffer): Promise<number | undefined> => {
  const metadata = await parseBuffer(buffer);
  return metadata.format.duration;
};
