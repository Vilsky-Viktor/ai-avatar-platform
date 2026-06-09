import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

export const resizeImage = async (input: Buffer, size: number): Promise<Buffer> => {
  const { hasAlpha } = await sharp(input).metadata();

  const pipeline = sharp(input)
    .resize(size, size, { fit: 'outside', kernel: 'lanczos3', withoutEnlargement: false })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.2 });

  if (hasAlpha) {
    pipeline.flatten({ background: { r: 100, g: 103, b: 107 } });
  }

  return pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
};

const extractFrame = async (videoBuffer: Buffer, seekSec: number): Promise<Buffer> => {
  const id = randomUUID();
  const tmpInput = path.join(os.tmpdir(), `thumb-in-${id}.mp4`);
  const tmpOutput = path.join(os.tmpdir(), `thumb-out-${id}.png`);

  try {
    await fs.promises.writeFile(tmpInput, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpInput)
        .seekInput(seekSec)
        .outputOptions(['-vframes 1', '-q:v 1'])
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

export const makeThumbnailFromVideo = async (videoBuffer: Buffer, size: number): Promise<Buffer> => {
  let frame: Buffer;
  try {
    frame = await extractFrame(videoBuffer, 0.5);
  } catch {
    frame = await extractFrame(videoBuffer, 0);
  }
  return resizeImage(frame, size);
};
