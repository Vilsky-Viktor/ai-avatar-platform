import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.MEDIA_URL;
const router = Router();

router.get(
    '/get/avatar/:id',
    createProxyHandler('get', (req) => `${BASE}/get/avatar/${req.params.id}`, 'Get media by avatar')
);
router.post(
    '/create',
    createProxyHandler('post', () => `${BASE}/create`, 'Create media')
);
router.post(
    '/create-training/:groupId',
    createProxyHandler('post', (req) => `${BASE}/create-training/${req.params.groupId}`, 'Create training media')
);

export default router;
