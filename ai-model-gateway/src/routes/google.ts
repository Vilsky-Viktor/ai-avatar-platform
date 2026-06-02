import { Router } from 'express';

import {
  genImage3Pro
} from '../controllers/googleImage3ProController';

const router = Router();

router.post('/image/3/pro', genImage3Pro);

export default router;