export enum SyncModes {
    cutOff = 'cut_off',
    loop = 'loop',
    bounce = 'bounce',
    silence = 'silence',
    remap = 'remap',
}

export type v3In = {
    avatarId: string;
    videoPath: string;
    audioPath: string;
    uploadPath: string;
}

export type v3Out = {
    video_url: string;
    audio_url: string;
    sync_mode: SyncModes,
}