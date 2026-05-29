import { Router } from 'express';

import {
  genV2ProEdit
} from '../controllers/falAiFluxController';

const router = Router();

router.post('/v2/pro/edit', genV2ProEdit);

export default router;