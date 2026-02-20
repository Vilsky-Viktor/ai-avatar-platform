import { Router } from 'express';
import {
  createIdPhotoJob,
  createPhotoSetJob
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo', createIdPhotoJob);
router.post('/create-photo-set', createPhotoSetJob);

export default router;