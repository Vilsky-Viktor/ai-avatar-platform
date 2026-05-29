export enum ImageSizes {
    landscape_4_3 = 'landscape_4_3',
    landscape_16_9 = 'landscape_16_9',
    square_hd = 'square_hd',
    portrait_4_3 = 'portrait_4_3',
    portrait_16_9 = 'portrait_16_9',
}

export enum Ratios {
    '4:3' = '4:3',
    '16:9' = '16:9',
    '1:1' = '1:1',
    '3:4' = '3:4',
    '9:16' = '9:16',
}

export const RatioToImageSizeMapping: Record<Ratios, ImageSizes> = {
    [Ratios['4:3']]: ImageSizes.landscape_4_3,
    [Ratios['16:9']]: ImageSizes.landscape_16_9,
    [Ratios['1:1']]: ImageSizes.square_hd,
    [Ratios['3:4']]: ImageSizes.portrait_4_3,
    [Ratios['9:16']]: ImageSizes.portrait_16_9,
}

export enum OutputFormats {
    png = 'png',
    jpeg = 'jpeg'
}