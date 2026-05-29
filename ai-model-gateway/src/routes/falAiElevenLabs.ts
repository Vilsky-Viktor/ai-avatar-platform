import { Router } from 'express';

import {
  genTtsElevenV3
} from '../controllers/falAiElevenLabsController';

const router = Router();

router.post('/tts/eleven/v3', genTtsElevenV3);

export default router;