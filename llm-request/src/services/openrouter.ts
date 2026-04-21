import { PERSON_CHARACTERISTICS_SYSTEM_MESSAGE } from "../utils/systemMessages";
import { ModelsSettings, ModelActions, SupportedModels, SystemMessages } from "../types/models";
import { getSecretValue } from "./secrets";
import { ImageData } from "../types/images";

const modelsSettings: ModelsSettings = {
    'qwen/qwen3.5-plus-02-15': { temperature: 0.7, max_tokens: 512 },
    'mistralai/pixtral-large-2411': { temperature: 0.7, max_tokens: 512 },
    'mistralai/mistral-small-3.2-24b-instruct': { temperature: 0.7, max_tokens: 512 },
}

const systemMessages: SystemMessages = {
    personCharacteristics: PERSON_CHARACTERISTICS_SYSTEM_MESSAGE
}

export const sendLlmRequest = async (prompt: string, images: ImageData[], model: SupportedModels, action: keyof ModelActions): Promise<string> => {
    const settings = modelsSettings[model];
    const systemContent = systemMessages[action];
    const secretKey = await getSecretValue('OPENROUTER_API_KEY');
    const userContent: any = []

    for (const imageData of images) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: "data:" + imageData.mimeType + ";base64," + imageData.image,
            },
        });
    }
    
    userContent.push({
        type: "text",
        text: prompt,
    });

    const  requestBody = {
        model: model,
        messages: [
            { role: "system", content: systemContent},
            { role: "user", content: userContent },
        ],
        ...settings
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + secretKey,
            "Content-Type": "application/json",
            "X-Title": "Prompt Upsampler",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("OpenRouter API error " + response.status + ": " + errorText);
    }
    
    const data = await response.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!answer) {
        throw new Error("Empty response from model");
    }

    return answer
}