import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.headers['x-user-id'] = decodedToken.uid;

    next();
  } catch (error) {
    req.log.error(error)
    res.status(401).send('Expired or Invalid Token');
  }
};