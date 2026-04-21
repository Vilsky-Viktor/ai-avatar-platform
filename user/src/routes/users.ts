import { Router } from 'express';
import {
  sync,
} from '../controllers/userController';

const router = Router();

router.post('/sync', sync);

export default router;