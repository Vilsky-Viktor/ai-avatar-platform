import { GoogleGenAI } from '@google/genai';
import logger from '@loom24/shared/logger';

const MODEL = 'gemini-3.5-flash';

let client: GoogleGenAI | null = null;

export const authenticate = async () => {
    client = new GoogleGenAI({
        vertexai: true,
        project: process.env.PROJECT_ID,
        location: 'global',
    });
};

const getClient = (): GoogleGenAI => {
    if (!client) throw new Error('Google AI client not initialized — call authenticate() first');
    return client;
};

export interface IdPhotoSelection {
    idPhotos: number[];
    shotType: string;
    direction: string;
    expression: string;
}

export const selectIdPhotos = async (prompt: string, systemPrompt: string): Promise<IdPhotoSelection> => {
    const response = await getClient().models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            systemInstruction: systemPrompt,
        },
    });

    const text = response.text;
    if (!text) {
        throw new Error('Empty response from Gemini');
    }

    logger.debug({ prompt, text }, 'Gemini response');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error(`Could not parse JSON object from Gemini response: ${text}`);
    }

    return JSON.parse(match[0]) as IdPhotoSelection;
};

export default {
    authenticate,
    selectIdPhotos,
};
