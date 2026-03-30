export type SupportedModels = 'qwen/qwen3.5-plus-02-15' | 'mistralai/pixtral-large-2411' | 'mistralai/mistral-small-3.2-24b-instruct';

export type ModelActions = {
    personCharacteristics?: string;
}

export type ModelSettings = {
    temperature: number;
    max_tokens?: number;
}

export type ModelsSettings = Record<SupportedModels, ModelSettings>;
export type SystemMessages = ModelActions