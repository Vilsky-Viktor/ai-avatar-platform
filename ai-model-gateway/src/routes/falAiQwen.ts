import { Router } from 'express';

import {
  genImage2512,
  genImageEdit2511,
  genImageEdit2511MultipleAngles
} from '../controllers/falAiQwenController';

const router = Router();

router.post('/image/2512', genImage2512);
router.post('/image/edit/2511', genImageEdit2511);
router.post('/image/edit/2511/multiple-angles', genImageEdit2511MultipleAngles);

export default router;