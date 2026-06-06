import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.AVATAR_URL;
const router = Router();

router.get(
    '/get/:id',
    createProxyHandler('get', (req) => `${BASE}/get/${req.params.id}`, 'Get avatar by ID')
);
router.get(
    '/get/slug/:slug',
    createProxyHandler('get', (req) => `${BASE}/get/slug/${req.params.slug}`, 'Get avatar by slug')
);
router.get(
    '/get-all',
    createProxyHandler('get', () => `${BASE}/get-all`, 'Get all avatars')
);
router.post(
    '/create',
    createProxyHandler('post', () => `${BASE}/create`, 'Create avatar')
);
router.patch(
    '/update/:id',
    createProxyHandler('patch', (req) => `${BASE}/update/${req.params.id}`, 'Update avatar')
);
router.delete(
    '/delete-by-id/:id',
    createProxyHandler('delete', (req) => `${BASE}/delete-by-avatar-id/${req.params.id}`, 'Delete avatar')
);

export default router;
