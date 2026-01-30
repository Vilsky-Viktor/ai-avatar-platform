import { Router } from 'express';
import {
  syncUser,
} from '../controllers/userController';

const router = Router();

router.post('/sync', syncUser);

export default router;