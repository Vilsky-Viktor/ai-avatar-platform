import { Router } from 'express';
import {
  createIdPhoto
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo', createIdPhoto);

export default router;