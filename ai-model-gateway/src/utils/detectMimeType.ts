export const detectMimeType = (buf: Buffer): string => {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';

    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
        const riffType = buf.subarray(8, 12).toString('ascii');
        if (riffType === 'WEBP') return 'image/webp';
        if (riffType === 'WAVE') return 'audio/wav';
        if (riffType === 'AVI ') return 'video/avi';
    }

    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
    if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
        const brand = buf.subarray(8, 12).toString('ascii');
        if (brand.startsWith('M4A')) return 'audio/mp4';
        if (brand === 'qt  ') return 'video/quicktime';
        return 'video/mp4';
    }

    if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return 'audio/ogg';
    if (buf[0] === 0x66 && buf[1] === 0x4c && buf[2] === 0x61 && buf[3] === 0x43) return 'audio/flac';
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return 'audio/mp3';
    if (buf[0] === 0xff && (buf[1] === 0xf1 || buf[1] === 0xf9)) return 'audio/aac';

    return 'application/octet-stream';
};
