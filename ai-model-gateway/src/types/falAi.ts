export enum Statuses {
    queue = 'IN_QUEUE',
    progress = 'IN_PROGRESS',
    completed = 'COMPLETED',
}

export type VideoResponse = {
    video: {
        filename?: string;
        url: string;
        file_size?: number;
        content_type?: string;
    }
}

export type ImageResponse = {
    images: {
        url: string;
        content_type?: string;
        height?: string;
        width?: string;
    }[];
    prompt: string;
}

export type AudioResponse = {
    audio: {
        url: string;
    }
}