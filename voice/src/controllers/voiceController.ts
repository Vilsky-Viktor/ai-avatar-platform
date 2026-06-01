import { Request, Response, NextFunction } from 'express';
import { 
  getByGender as getByGenderDb 
} from '../repositories/voice';

export const getByGender = async (req: Request, res: Response, next: NextFunction) => {
  const gender = req.params.gender as string;

  req.log.info(`Get voices by gender ${gender}`);

  try {
    const voicesDB = await getByGenderDb(gender);

    return res.status(201).json(voicesDB);
  } catch (error) {
    req.log.info(`Failed to get voices by gender ${gender}: ${error}`);
    next(error);
  }
};
