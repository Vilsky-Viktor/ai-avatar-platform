import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.USER_URL;
const router = Router();

router.get(
    '/get/user/:id',
    createProxyHandler('get', (req) => `${BASE}/get/user/${req.params.id}`, 'Get user by ID')
);

router.post(
    '/sync',
    createProxyHandler('post', () => `${BASE}/sync`, 'Sync user')
);

export default router;
