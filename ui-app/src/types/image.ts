export type Ratio = '9:16' | '3:4' | '1:1' | '4:3' | '16:9';
export type VideoRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type PhotoSetType = 'whatsapp-stickers' | 'around-the-world' | 'outfit-styles' | 'luxury-life';

export const RATIOS: { value: Ratio; w: number; h: number }[] = [
    { value: '9:16', w: 18, h: 32 },
    { value: '3:4',  w: 21, h: 28 },
    { value: '1:1',  w: 26, h: 26 },
    { value: '4:3',  w: 28, h: 21 },
    { value: '16:9', w: 32, h: 18 },
];

export const VIDEO_RATIOS: { value: VideoRatio; w: number; h: number }[] = [
    { value: '9:16', w: 18, h: 32 },
    { value: '3:4',  w: 21, h: 28 },
    { value: '1:1',  w: 26, h: 26 },
    { value: '4:3',  w: 28, h: 21 },
    { value: '16:9', w: 32, h: 18 },
];
