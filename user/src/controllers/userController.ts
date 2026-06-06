import { Request, Response, NextFunction } from 'express';
import { User } from '../types/user';
import logger, { setLogContext, clearLogContext } from '@loom24/shared/logger';
import { sync as syncDB, getById as getByIdDb } from '../repositories/user';
import admin from 'firebase-admin';

export const linkGoogle = async (req: Request, res: Response, next: NextFunction) => {
  const { googleIdToken } = req.body;

  if (!googleIdToken) {
    return res.status(400).json({ error: 'googleIdToken is required' });
  }

  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${googleIdToken}`
    );

    if (!tokenInfoRes.ok) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const tokenInfo = await tokenInfoRes.json() as { email?: string; email_verified?: string };

    if (!tokenInfo.email || tokenInfo.email_verified !== 'true') {
      return res.status(400).json({ error: 'Email not verified' });
    }

    const existingUser = await admin.auth().getUserByEmail(tokenInfo.email);
    const customToken = await admin.auth().createCustomToken(existingUser.uid);

    return res.json({ customToken });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id as string;
  const headerUserId = req.headers['x-user-id'] as string;

  if (userId !== headerUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  setLogContext(userId);
  try {
    logger.info('Get user by ID');
    const userDB = await getByIdDb(userId);
    if (!userDB) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(userDB);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user by ID');
    next(error);
  } finally {
    clearLogContext();
  }
}

export const sync = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const user: User = req.body;

  if (userId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  setLogContext(userId);
  try {
    logger.info('Sync user');
    const { user: userDB, created } = await syncDB(user);
    return res.status(created ? 201 : 200).json(userDB);
  } catch (error) {
    logger.error({ err: error }, 'Failed to sync user');
    next(error);
  } finally {
    clearLogContext();
  }
};
