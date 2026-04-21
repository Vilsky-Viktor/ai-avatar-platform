import { Router } from 'express';
import {
  getByGender,
} from '../controllers/voiceController';

const router = Router();

router.get('/get-by-gender/:gender', getByGender);

export default router;