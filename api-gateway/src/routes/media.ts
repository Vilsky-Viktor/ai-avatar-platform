import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.MEDIA_SERVICE_URL;
const router = Router();

router.post('/create', createProxyHandler('post', () => `${BASE}/create`, 'Create media'));

export default router;
