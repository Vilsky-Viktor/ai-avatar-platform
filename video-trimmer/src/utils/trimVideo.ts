import ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { parseBuffer } from 'music-metadata';

export const getDurationSec = async (buffer: Buffer): Promise<number | undefined> => {
  const metadata = await parseBuffer(buffer);
  return metadata.format.duration;
};

export const trimVideo = async (buffer: Buffer, maxDurationSec: number): Promise<Buffer> => {
  const id = randomUUID();
  const tmpInput = path.join(os.tmpdir(), `trim-in-${id}.mp4`);
  const tmpOutput = path.join(os.tmpdir(), `trim-out-${id}.mp4`);

  try {
    await fs.promises.writeFile(tmpInput, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpInput)
        .outputOptions([`-t ${maxDurationSec}`, '-c copy'])
        .output(tmpOutput)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    return await fs.promises.readFile(tmpOutput);
  } finally {
    await Promise.all([
      fs.promises.rm(tmpInput, { force: true }),
      fs.promises.rm(tmpOutput, { force: true }),
    ]);
  }
};
