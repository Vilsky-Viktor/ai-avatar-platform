export enum TextNormalizations {
    auto = 'auto',
    on = 'on',
    off = 'off'
}

export type TtsElevenV3In = {
    avatarId: string;
    text: string;
    voice: string;
    language: string;
    uploadPath: string;
}

export type TtsElevenV3Out = {
    text: string;
    voice: string;
    stability: number;
    timestamps?: boolean;
    language_code: string;
    apply_text_normalization: TextNormalizations;
}