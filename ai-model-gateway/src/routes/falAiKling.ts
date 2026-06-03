import { Router } from 'express';

import {
    genVideoV3ProImageToVideo,
    genVideoV3ProMotionControl
} from '../controllers/falAiKlingController';

const router = Router();

router.post('/video/v3/pro/image-to-video', genVideoV3ProImageToVideo);
router.post('/video/v3/pro/motion-control', genVideoV3ProMotionControl);

export default router;