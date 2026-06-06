import { Router } from 'express';
import { getFiltered, getFilterOptions } from '../controllers/voiceController';

const router = Router();

router.get('/get/gender/:gender', getFiltered);
router.get('/options/gender/:gender', getFilterOptions);

export default router;
