import { Router } from 'express';

import {
    genV3
} from '../controllers/falAiSyncLipsyncController';

const router = Router();

router.post('/v3', genV3);

export default router;