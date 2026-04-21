import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.JOB_MANAGER_SERVICE_URL;
const router = Router();

router.get(
    '/get/group/:groupId',
    createProxyHandler('get', (req) => `${BASE}/get/group/${req.params.groupId}`, 'Get by group ID')
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
    '/restart/:id',
    createProxyHandler('post', (req) => `${BASE}/restart/${req.params.id}`, 'Restart job')
);
router.post(
    '/train-loras/group/:groupId',
    createProxyHandler('post', (req) => `${BASE}/train-loras/group/${req.params.groupId}`, 'Train LORAs')
);

export default router;
