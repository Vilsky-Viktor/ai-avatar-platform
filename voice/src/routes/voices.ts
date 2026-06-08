import { Router } from 'express';
import { getFiltered } from '../controllers/voiceController';

const router = Router();

router.get('/get/gender/:gender', getFiltered);

export default router;
