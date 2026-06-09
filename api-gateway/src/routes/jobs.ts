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
router.get(
    '/counts/avatar/:avatarId',
    createProxyHandler('get', (req) => `${BASE}/counts/avatar/${req.params.avatarId}`, 'Get job counts by avatar ID')
)
router.post(
    '/gen-synthetic-front-id-photo',
    createProxyHandler('post', () => `${BASE}/gen-synthetic-front-id-photo`, 'Create synthetic front ID photo')
);
router.post(
    '/gen-synthetic-id-photos',
    createProxyHandler('post', () => `${BASE}/gen-synthetic-id-photos`, 'Create synthetic ID photos')
);
router.post(
    '/gen-digital-twin-id-photo',
    createProxyHandler('post', () => `${BASE}/gen-digital-twin-id-photo`, 'Create digital twin ID photo')
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
    '/mimic-motion',
    createProxyHandler('post', () => `${BASE}/mimic-motion`, 'Mimic motion video')
);
router.post(
    '/gen-avatar-audio',
    createProxyHandler('post', () => `${BASE}/gen-avatar-audio`, 'Generate avatar audio')
);
router.post(
    '/restart/job/:id',
    createProxyHandler('post', (req) => `${BASE}/restart/job/${req.params.id}`, 'Restart job')
);
router.delete(
    '/delete/job/:id',
    createProxyHandler('delete', (req) => `${BASE}/delete/job/${req.params.id}`, 'Delete job')
);

export default router;
