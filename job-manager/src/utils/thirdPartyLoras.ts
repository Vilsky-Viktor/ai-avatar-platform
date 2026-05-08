const qwen2511ModelLoraPath = 'models/qwen-edit-2511/loras';

export enum Qwen2511Loras {
    lightning8stepsV2 = `${qwen2511ModelLoraPath}/Qwen-Image-Lightning-8steps-V2.0/Qwen-Image-Lightning-8steps-V2.0-bf16.safetensors`,
    editSkin = `${qwen2511ModelLoraPath}/qwen-edit-skin`,
    multipleAngles = `${qwen2511ModelLoraPath}/Qwen-Image-Edit-2511-Multiple-Angles-LoRA`,
    inSubject = `${qwen2511ModelLoraPath}/Qwen-Image-Edit-InSubject`,
    pixelSmile = `${qwen2511ModelLoraPath}/Qwen-PixelSmile`,
    relight = `${qwen2511ModelLoraPath}/Qwen-Image-Edit-2509-Relight`,
}