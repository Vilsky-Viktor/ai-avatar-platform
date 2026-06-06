import { Request, Response, NextFunction } from 'express';
import { AvatarGender } from '../types/avatar';
import { getByGender as getByGenderDb } from '../repositories/voice';

const VALID_GENDERS = Object.values(AvatarGender);

export const getByGender = async (req: Request, res: Response, next: NextFunction) => {
  const gender = req.params.gender as string;

  if (!VALID_GENDERS.includes(gender as AvatarGender)) {
    return res.status(400).json({ error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}` });
  }

  req.log.info({ gender }, 'Get voices by gender');

  try {
    const voicesDB = await getByGenderDb(gender);
    return res.status(200).json(voicesDB);
  } catch (error) {
    req.log.error({ gender, err: error }, 'Failed to get voices by gender');
    next(error);
  }
};
