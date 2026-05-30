import { Router } from 'express';

import {
  upscaleImage,
} from '../controllers/falAiSeedvrController';

const router = Router();

router.post('/image/upscale', upscaleImage);

export default router;