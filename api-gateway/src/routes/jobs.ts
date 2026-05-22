import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.JOB_MANAGER_URL;
const router = Router();

router.get(
    '/get/group/:groupId',
    createProxyHandler('get', (req) => `${BASE}/get/group/${req.params.groupId}`, 'Get by group ID')
)
router.get(
    '/get/avatar/:avatarId',
    createProxyHandler('get', (req) => `${BASE}/get/avatar/${req.params.avatarId}`, 'Get by avatar ID')
)
router.post(
    '/gen-training-photo-set',
    createProxyHandler('post', () => `${BASE}/gen-training-photo-set`, 'Create training photo set')
);
router.post(
    '/gen-training-synthetic-front-id-photo',
    createProxyHandler('post', () => `${BASE}/gen-training-synthetic-front-id-photo`, 'Create synthetic front ID photo')
);
router.post(
    '/gen-training-synthetic-id-photos',
    createProxyHandler('post', () => `${BASE}/gen-training-synthetic-id-photos`, 'Create synthetic ID photos')
);
router.post(
    '/gen-training-twin-id-photos',
    createProxyHandler('post', () => `${BASE}/gen-training-twin-id-photos`, 'Create twin ID photos')
);
router.post(
    '/gen-avatar-photo',
    createProxyHandler('post', () => `${BASE}/gen-avatar-photo`, 'Generate avatar photo')
);
router.post(
    '/gen-avatar-photo-set',
    createProxyHandler('post', () => `${BASE}/gen-avatar-photo-set`, 'Generate avatar photo set')
);
router.post(
    '/gen-avatar-video',
    createProxyHandler('post', () => `${BASE}/gen-avatar-video`, 'Generate avatar video')
);
router.post(
    '/restart/:id',
    createProxyHandler('post', (req) => `${BASE}/restart/${req.params.id}`, 'Restart job')
);
router.post(
    '/train-loras/',
    createProxyHandler('post', () => `${BASE}/train-loras`, 'Train LORAs')
);
router.delete(
    '/delete-by-id/:id',
    createProxyHandler('delete', (req) => `${BASE}/delete-by-id/${req.params.id}`, 'Delete job')
);

export default router;
