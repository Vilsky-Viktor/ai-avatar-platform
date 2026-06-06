import { GoogleGenAI } from "@google/genai";
import { AiModelGateway, MediaTypes, Models } from "../types/job";
import { detectMimeType } from "../utils/detectMimeType";
import platform from '../types/platform';
import { downloadFromPath } from "./storage";
import googleTypes from '../types/google';
import { OutputMimeTypes, Ratios } from "../types/image";

let client: GoogleGenAI | null = null;

export const authenticate = async () => {
    client = new GoogleGenAI({
        vertexai: true,
        project: process.env.PROJECT_ID,
        location: 'global'
    });
};

const getClient = (): GoogleGenAI => {
    if (!client) throw new Error('Google AI client not initialized — call authenticate() first');
    return client;
};

export const getPlatformModelName = (model: Models): string => {
    const mapped = googleTypes.MODEL_MAPPING[model];
    if (!mapped) throw new Error(`No Google model mapping for: ${model}`);
    return mapped;
}

export const generate = async (data: AiModelGateway, media: Buffer[], config: object): Promise<platform.GeneratedData> => {
    const platformModel = getPlatformModelName(data.model);

    const promptPayload = { text: data.prompt };
    const mediaPayload = media.map((buf) => ({
        inlineData: {
            mimeType: detectMimeType(buf),
            data: buf.toString('base64'),
        },
    }));

    const response = await getClient().models.generateContent({
        model: platformModel,
        contents: [promptPayload, ...mediaPayload],
        config: { ...config, responseModalities: ['IMAGE'] }
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

export const genGeminiImage3Pro = async (data: AiModelGateway): Promise<platform.HandlerResponse> => {
    const mediaBuffers = await Promise.all(
        data.imagePaths!.map((path) => downloadFromPath(path))
    );

    const config: googleTypes.GeminiImage3Pro = {
        candidateCount: 1,
        topP: 0.95,
        topK: 40,
        temperature: data.temperature,
        imageConfig: {
            aspectRatio: data.ratio,
            imageOutputFormat: OutputMimeTypes.png,
            imageSize: googleTypes.ImageSizes._2k,
            personGeneration: googleTypes.PersonGenerations.allowAdult,
            editMode: googleTypes.EditModes.default
        },
    };

    return {
        type: MediaTypes.image,
        data: await generate(data, mediaBuffers, config)
    };
};

export default {
    authenticate,
    generate,
    genGeminiImage3Pro
};
