import { GoogleGenAI } from "@google/genai";
import { getSecretValue } from "./secretManager";
import { detectMimeType } from "../utils/detectMimeType";

let client: GoogleGenAI | null = null;

export const authenticate = async () => {
    const apiKey = await getSecretValue('GOOGLE_AI_STUDIO_API_KEY');
    client = new GoogleGenAI({ apiKey });
};

const getClient = (): GoogleGenAI => {
    if (!client) throw new Error('Google AI Studio client not initialized — call authenticate() first');
    return client;
};


export const sendRequest = async (modelName: string, prompt: string, media: Buffer[], config: object): Promise<Buffer> => {
    const promptPayload = { text: prompt };
    const mediaPayload = media.map((buf) => ({
        inlineData: {
            mimeType: detectMimeType(buf),
            data: buf.toString('base64'),
        },
    }));

    const response = await getClient().models.generateContent({
        model: modelName,
        contents: [promptPayload, ...mediaPayload],
        config
    });

    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Google AI Studio request blocked — finishReason: ${finishReason}`);
    }

    const inlineData = candidate?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
        throw new Error('No image data in Google AI Studio response');
    }

    return Buffer.from(inlineData.data, 'base64');
};

export default { authenticate, sendRequest };
