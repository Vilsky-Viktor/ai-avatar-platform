import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

export const resizeImage = async (input: Buffer, size: number): Promise<Buffer> => {
  return sharp(input)
    .resize(size, size, { fit: 'outside', kernel: 'lanczos3', withoutEnlargement: false })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.2 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
};

const extractFrame = (videoBuffer: Buffer, seekSec: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const tmpInput = path.join(os.tmpdir(), `thumb-in-${id}.mp4`);
    const tmpOutput = path.join(os.tmpdir(), `thumb-out-${id}.png`);

    fs.writeFileSync(tmpInput, videoBuffer);

    ffmpeg(tmpInput)
      .seekInput(seekSec)
      .outputOptions(['-vframes 1', '-q:v 1'])
      .output(tmpOutput)
      .on('end', () => {
        try {
          const frame = fs.readFileSync(tmpOutput);
          resolve(frame);
        } catch (err) {
          reject(err);
        } finally {
          fs.rmSync(tmpInput, { force: true });
          fs.rmSync(tmpOutput, { force: true });
        }
      })
      .on('error', (err) => {
        fs.rmSync(tmpInput, { force: true });
        fs.rmSync(tmpOutput, { force: true });
        reject(err);
      })
      .run();
  });
};

export const makeThumbnailFromVideo = async (videoBuffer: Buffer, size: number): Promise<Buffer> => {
  let frame: Buffer;
  try {
    // Seek to 0.5 s to skip black/fade-in opening frames
    frame = await extractFrame(videoBuffer, 0.5);
  } catch {
    // Fallback to the very first frame if the video is shorter than 0.5 s
    frame = await extractFrame(videoBuffer, 0);
  }
  return resizeImage(frame, size);
};
