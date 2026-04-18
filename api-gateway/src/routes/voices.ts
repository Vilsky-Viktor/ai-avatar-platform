import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.VOICE_SERVICE_URL;
const router = Router();

router.get('/get-by-gender/:gender', createProxyHandler('get', (req) => `${BASE}/get-by-gender/${req.params.gender}`, 'Get voices by gender'));

export default router;
