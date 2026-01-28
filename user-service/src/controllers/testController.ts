import { Request, Response, NextFunction } from 'express';

export const test = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({status: 'ok'});
  } catch (error) {
    next(error);
  }
};