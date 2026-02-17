import { Router } from 'express';
import {
  createMedia,
} from '../controllers/mediaController';

const router = Router();

router.post('/create', createMedia);

export default router;