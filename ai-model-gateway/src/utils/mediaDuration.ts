import { parseBuffer } from 'music-metadata';

export type MediaInfo = {
  duration?: number;
  dimensions?: string;
};

const MOOV = 0x6d6f6f76;
const TRAK = 0x7472616b;
const TKHD = 0x746b6864;

function findBoxInRange(buffer: Buffer, type: number, start: number, end: number): number {
  let offset = start;
  while (offset + 8 <= end) {
    const size = buffer.readUInt32BE(offset);
    if (size < 8 || offset + size > buffer.length) break;
    if (buffer.readUInt32BE(offset + 4) === type) return offset;
    offset += size;
  }
  return -1;
}

function readMp4Dimensions(buffer: Buffer): string | undefined {
  const moovOffset = findBoxInRange(buffer, MOOV, 0, buffer.length);
  if (moovOffset === -1) return undefined;

  const moovEnd = moovOffset + buffer.readUInt32BE(moovOffset);
  let searchFrom = moovOffset + 8;

  while (searchFrom < moovEnd) {
    const trakOffset = findBoxInRange(buffer, TRAK, searchFrom, moovEnd);
    if (trakOffset === -1) break;

    const trakEnd = trakOffset + buffer.readUInt32BE(trakOffset);
    const tkhdOffset = findBoxInRange(buffer, TKHD, trakOffset + 8, trakEnd);

    if (tkhdOffset !== -1) {
      const version = buffer.readUInt8(tkhdOffset + 8);
      const dimOffset = version === 1 ? tkhdOffset + 96 : tkhdOffset + 84;

      if (dimOffset + 8 <= buffer.length) {
        const width = buffer.readUInt32BE(dimOffset) >>> 16;
        const height = buffer.readUInt32BE(dimOffset + 4) >>> 16;
        if (width > 0 && height > 0) return `${width}x${height}`;
      }
    }

    searchFrom = trakEnd;
  }

  return undefined;
}

export const getMediaInfo = async (buffer: Buffer): Promise<MediaInfo> => {
  const metadata = await parseBuffer(buffer);
  const duration = metadata.format.duration;

  const videoTrack = metadata.format.trackInfo?.find(track => track.video);
  const mmWidth = videoTrack?.video?.pixelWidth;
  const mmHeight = videoTrack?.video?.pixelHeight;

  const dimensions = (mmWidth && mmHeight)
    ? `${mmWidth}x${mmHeight}`
    : readMp4Dimensions(buffer);

  return { duration, dimensions };
};
