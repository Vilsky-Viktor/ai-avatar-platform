import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ err }, 'Unhandled error');
  const status = err.status || (err as any).response?.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
};
