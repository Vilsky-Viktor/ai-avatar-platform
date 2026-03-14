import { ModelActions, SupportedModels, SupportedTargetModels } from "./models"

export type UpsampleRequest = {
    promptModel: SupportedModels;
    targetModel: SupportedTargetModels;
    prompt: string;
    imagePaths: string[];
    action: keyof ModelActions;
}