import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.CROPPER_URL;
const router = Router();

router.post(
    '/crop-headshot',
    createProxyHandler('post', () => `${BASE}/crop-headshot`, 'Crop headshot')
);

export default router;
