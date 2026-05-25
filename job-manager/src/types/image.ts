export type PhotoSetType = 'whatsapp-stickers' | 'around-the-world' | 'outfit-styles' | 'luxury-life';

export const ratios = {
    'square': '1:1',
    'landscape': '16:9',
    'portrait': '9:16',
    'photo': '4:3',
    'vertical': '3:4',
    'wide': '3:2',
    'tall': '2:3',
}

export const qwenEdit2511 = {
    "1:1TV": [1024, 1024],
    "1:1TI": [1312, 1312],
    "1:1": [1328, 1328],
    "16:9": [1664, 928],
    "9:16": [928, 1664],
    "4:3": [1472, 1104],
    "3:4": [1104, 1472],
    "3:2": [1584, 1056],
    "2:3": [1056, 1584],
}

export const wan22Ti2v = {
    "1:1":  [720, 720],
    "16:9": [1280, 720],
    "9:16": [720, 1280],
    "4:3":  [960, 720],
    "3:4":  [720, 960],
}

export const wan22Vace = {
    "1:1":  [720, 720],
    "16:9": [1280, 720],
    "9:16": [720, 1280],
    "4:3":  [960, 720],
    "3:4":  [720, 960],
}

export type VideoRatio = keyof typeof wan22Ti2v;

export default {
    ratios,
    qwenEdit2511,
    wan22Ti2v,
    wan22Vace,
}