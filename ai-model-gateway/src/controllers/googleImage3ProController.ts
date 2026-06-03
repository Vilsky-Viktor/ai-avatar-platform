import { Request, Response, NextFunction } from 'express';
import { downloadFromPath, uploadToBucket } from '../services/storage';
import { sendRequest } from '../services/googleAiStudio';
import { EditModes, GenImage3ProIn, GenImage3ProOut, ImageSizes, PersonGenerations } from '../types/google';
import { OutputMimeTypes } from '../types/image';

export const genImage3Pro = async (req: Request, res: Response, next: NextFunction) => {
    const input = req.body as GenImage3ProIn;
    const modelName = 'gemini-3-pro-image';

    try {
        const mediaBuffers = await Promise.all(
            input.imagePaths.map((path) => downloadFromPath(path))
        );

        const config: GenImage3ProOut = {
            candidateCount: 1,
            topP: 0.95,
            topK: 40,
            temperature: input.temperature,
            imageConfig: {
                aspectRatio: input.ratio,
                imageOutputFormat: OutputMimeTypes.png,
                imageSize: ImageSizes._2k,
                personGeneration: PersonGenerations.allowAdult,
                editMode: EditModes.default
            },
        };

        const resultBuffer = await sendRequest(modelName, input.prompt, mediaBuffers, config);
        await uploadToBucket(resultBuffer, input.uploadPath);

        return res.status(200).json({ mediaPath: input.uploadPath });
    } catch (error: any) {
        req.log.info(`Failed to generate with Imagen 3 Pro: ${error}`);
        next(error);
    }
};
