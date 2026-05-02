import { Router } from 'express';
import { createProxyHandler } from '../utils/proxy';

const BASE = process.env.USER_URL;
const router = Router();

router.post(
    '/link-google',
    createProxyHandler('post', () => `${BASE}/link-google`, 'Link Google account')
);

export default router;
