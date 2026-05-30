export enum Statuses {
    queue = 'IN_QUEUE',
    progress = 'IN_PROGRESS',
    completed = 'COMPLETED',
}

export type VideoResponse = {
    video: {
        url: string;
    }
}

export type ImagesResponse = {
    images: {
        url: string;
    }[];
    prompt: string;
}


export type ImageResponse = {
    image: {
        url: string;
    }
}

export type AudioResponse = {
    audio: {
        url: string;
    }
}