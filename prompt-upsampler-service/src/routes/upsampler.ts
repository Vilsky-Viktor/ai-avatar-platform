import { Router } from 'express';
import { upsamplePrompt } from '../controllers/upsamplerController';

const router = Router();

router.post('/upsample', upsamplePrompt);

export default router;