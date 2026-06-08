import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const TOKEN_CACHE_MAX_SIZE = 1000;
const tokenCache = new Map<string, { uid: string; expiresAt: number }>();

function getCachedUid(token: string): string | null {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(token);
    return null;
  }
  // Move to end so it is the most recently used
  tokenCache.delete(token);
  tokenCache.set(token, entry);
  return entry.uid;
}

function cacheToken(token: string, uid: string): void {
  if (tokenCache.size >= TOKEN_CACHE_MAX_SIZE) {
    // Evict least recently used (first entry in insertion-order Map)
    const firstKey = tokenCache.keys().next().value;
    if (firstKey !== undefined) tokenCache.delete(firstKey);
  }
  tokenCache.set(token, { uid, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  const cachedUid = getCachedUid(token);
  if (cachedUid) {
    req.headers['x-user-id'] = cachedUid;
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    cacheToken(token, decodedToken.uid);
    req.headers['x-user-id'] = decodedToken.uid;
    next();
  } catch (error) {
    req.log.error(error);
    res.status(401).send('Expired or Invalid Token');
  }
};
