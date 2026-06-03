export const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();

    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const pcm = audioBuffer.getChannelData(0);
    const numSamples = pcm.length;
    const dataSize = numSamples * 2;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const str = (offset: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };

    str(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, pcm[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
};
