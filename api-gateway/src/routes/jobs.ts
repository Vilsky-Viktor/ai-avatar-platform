import { Router } from 'express';
import {
  genTrainingPhotoSet,
  genTrainingSyntheticFrontIdPhoto,
  genTrainingSyntheticIdPhotos,
  genTrainingTwinIdPhotos,
  restartJob
} from '../controllers/jobController';

const router = Router();

router.post('/gen-training-photo-set', genTrainingPhotoSet);
router.post('/gen-training-synthetic-front-id-photo', genTrainingSyntheticFrontIdPhoto);
router.post('/gen-training-synthetic-id-photos', genTrainingSyntheticIdPhotos);
router.post('/gen-training-twin-id-photos', genTrainingTwinIdPhotos);
router.post('/restart/:id', restartJob);
export default router;