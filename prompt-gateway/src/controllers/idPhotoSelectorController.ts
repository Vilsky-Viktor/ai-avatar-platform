import { Request, Response, NextFunction } from 'express';
import logger from '@loom24/shared/logger';
import google from '../services/google';
import { ID_PHOTO_SELECTOR_SYSTEM_PROMPT } from '../utils/systemPrompts';

export const selectIdPhotos = async (req: Request, res: Response, next: NextFunction) => {
    const { prompt } = req.body as { prompt: string };

    logger.info(`Select ID photos for prompt: ${prompt}`);

    if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'prompt is required and must be a string' });
        return;
    }

    try {
        const result = await google.selectIdPhotos(prompt, ID_PHOTO_SELECTOR_SYSTEM_PROMPT);
        res.json({ prompt, result });
    } catch (error) {
        logger.error({ err: error, prompt }, 'selectIdPhotos failed');
        next(error);
    }
};
