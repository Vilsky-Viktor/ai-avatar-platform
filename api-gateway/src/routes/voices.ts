import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.VOICE_URL;
const router = Router();

router.get(
    '/get/gender/:gender',
    createProxyHandler('get', (req) => `${BASE}/get/gender/${req.params.gender}`, 'Get voices by gender')
);

export default router;
