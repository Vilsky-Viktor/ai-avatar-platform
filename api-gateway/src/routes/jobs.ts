import { Router } from 'express';
import {
  genTrainingPhotoSet,
  genTrainingIdPhotos,
  genTrainingIdPhotosFromUploaded,
  restartJob
} from '../controllers/jobController';

const router = Router();

router.post('/gen-training-photo-set', genTrainingPhotoSet);
router.post('/gen-training-id-photos', genTrainingIdPhotos);
router.post('/gen-training-id-photos-from-uploaded', genTrainingIdPhotosFromUploaded);
router.post('/restart/:id', restartJob);
export default router;