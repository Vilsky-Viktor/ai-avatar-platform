import { Router } from 'express';
import {
  sync,
  linkGoogle,
} from '../controllers/userController';

const router = Router();

router.post('/sync', sync);
router.post('/link-google', linkGoogle);

export default router;