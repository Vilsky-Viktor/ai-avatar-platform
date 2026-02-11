import { Router } from 'express';
import {
  createIdPhotoJob,
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo', createIdPhotoJob);

export default router;