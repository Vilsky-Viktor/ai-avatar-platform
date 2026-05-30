import { Router } from 'express';

import {
    genVideoV3ProImageToVideo
} from '../controllers/falAiKlingController';

const router = Router();

router.post('/video/v3/pro/image-to-video', genVideoV3ProImageToVideo);

export default router;