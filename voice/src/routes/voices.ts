import { Router } from 'express';
import {
  getByGender,
} from '../controllers/voiceController';

const router = Router();

router.get('/get/gender/:gender', getByGender);

export default router;
