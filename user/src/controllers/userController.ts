import { Request, Response, NextFunction } from 'express';
import { User } from '../types/user';
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
  const userId = req.params.id as string
  const headerUserId = req.headers['x-user-id'] as string;

  if (userId !== headerUserId) {
    return res.status(400).json({error: 'Bad request'});
  }

  req.log.info(`Sync user ${userId}`);

  try {
    const userDB = await getByIdDb(userId);
    return res.status(200).json(userDB);
  } catch (error) {
    req.log.info(`Failed to get user ${userId}: ${error}`);
    next(error);
  }
}

export const sync = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const user: User = req.body;

  req.log.info(`Sync user ${user.id}`);

  if (userId !== user.id) {
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