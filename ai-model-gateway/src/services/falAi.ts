import { fal, Result, QueueStatus } from "@fal-ai/client";
import { Statuses } from "../types/falAi";
import { getSecretValue } from "./secretManager";
import logger from '../logger';

export const authenticate = async () => {
    fal.config({
        credentials: await getSecretValue('FAL_AI_API_KEY'),
    });
}

export const sendRequest = async <Input extends Record<string, any>, Output>(modelName: string, payload: Input): Promise<Result<Output>> => {
    const modelPath = `fal-ai/${modelName}`;

    const result = await fal.subscribe(modelPath, {
        input: payload,
        logs: false,
        onQueueUpdate: (update: QueueStatus) => {
            if (update.status === Statuses.progress) {
                update.logs.map((log) => log.message).forEach(logger.info);
            }
        },
    });

    return result as Result<Output>;
}

export default {
    authenticate,
    sendRequest
}