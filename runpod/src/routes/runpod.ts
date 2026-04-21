import { Router } from 'express';
import {
  createPod
} from '../controllers/runpodController';

const router = Router();

router.post('/create-pod', createPod);

export default router;