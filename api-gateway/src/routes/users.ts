import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.USER_SERVICE_URL;
const router = Router();

router.post('/sync', createProxyHandler('post', () => `${BASE}/sync`, (req) => `Sync user ID ${req.headers['x-user-id']}`));

export default router;
