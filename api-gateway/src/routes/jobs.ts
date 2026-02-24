import { Router } from 'express';
import {
  createIdPhotoJobView0,
  createIdPhotoJobView45,
  createIdPhotoJobView90,
  createPhotoSetJob
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo-view0', createIdPhotoJobView0);
router.post('/create-id-photo-view45', createIdPhotoJobView45);
router.post('/create-id-photo-view90', createIdPhotoJobView90);
router.post('/create-photo-set', createPhotoSetJob);

export default router;