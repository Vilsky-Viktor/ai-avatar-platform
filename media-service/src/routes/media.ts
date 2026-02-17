import { Router } from 'express';
import {
  create
} from '../controllers/mediaController';

const router = Router();

router.post('/create', create);

export default router;