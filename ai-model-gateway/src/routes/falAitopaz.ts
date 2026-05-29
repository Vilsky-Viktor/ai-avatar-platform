import { Router } from 'express';

import {
  upscaleImage,
  upscaleVideo
} from '../controllers/falAiTopazController';

const router = Router();

router.post('/image/upscale', upscaleImage);
router.post('/video/upscale', upscaleVideo);

export default router;