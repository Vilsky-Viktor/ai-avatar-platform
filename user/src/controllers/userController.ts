import { Request, Response, NextFunction } from 'express';
import { User } from '../types/user';
import { sync as syncDB } from '../repositories/user';

export const sync = async (req: Request, res: Response, next: NextFunction) => {
  const headerUserId = req.headers['x-user-id'];
  const user: User = req.body;

  req.log.info(`Sync user ${user.id}`);

  if (headerUserId as string !== user.id) {
    return res.status(400).json({error: 'Bad request'});
  }

  try {
    const userDB = await syncDB(user);

    return res.status(201).json(userDB);
  } catch (error) {
    req.log.info(`Failed to sync user ${user.id}: ${error}`);
    next(error);
  }
};