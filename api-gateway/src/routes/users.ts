import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.USER_SERVICE_URL;
const router = Router();

router.post(
    '/sync',
    createProxyHandler('post', () => `${BASE}/sync`, 'Sync user')
);

export default router;
