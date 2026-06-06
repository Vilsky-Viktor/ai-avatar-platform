import { Router } from 'express';
import {
  sync,
  linkGoogle,
  getById
} from '../controllers/userController';

const router = Router();

router.get('/get/user/:id', getById);
router.post('/sync', sync);
router.post('/link-google', linkGoogle);

export default router;
