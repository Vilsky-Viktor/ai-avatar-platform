import { Request, Response, NextFunction } from 'express';
import { AvatarGender } from '../types/avatar';
import {
    getFiltered as getFilteredDb,
    getFilterOptions as getFilterOptionsDb,
    type VoiceFilters,
} from '../repositories/voice';

const VALID_GENDERS = Object.values(AvatarGender);

const validateGender = (gender: string, res: Response): boolean => {
    if (!VALID_GENDERS.includes(gender as AvatarGender)) {
        res.status(400).json({ error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}` });
        return false;
    }
    return true;
};

const str = (v: unknown): string | undefined =>
    typeof v === 'string' ? v : undefined;

export const getFiltered = async (req: Request, res: Response, next: NextFunction) => {
    const gender = req.params.gender as string;
    if (!validateGender(gender, res)) return;

    const cursor = str(req.query.cursor);
    const filters: VoiceFilters = {
        language: str(req.query.language),
        age:      str(req.query.age),
        category: str(req.query.category),
        useCase:  str(req.query.useCase),
    };

    req.log.info({ gender, filters }, 'Get filtered voices');

    try {
        const result = await getFilteredDb(gender, filters, cursor);
        return res.status(200).json(result);
    } catch (error) {
        req.log.error({ gender, err: error }, 'Failed to get filtered voices');
        next(error);
    }
};

export const getFilterOptions = async (req: Request, res: Response, next: NextFunction) => {
    const gender = req.params.gender as string;
    if (!validateGender(gender, res)) return;

    req.log.info({ gender }, 'Get voice filter options');

    try {
        const options = await getFilterOptionsDb(gender);
        return res.status(200).json(options);
    } catch (error) {
        req.log.error({ gender, err: error }, 'Failed to get voice filter options');
        next(error);
    }
};
