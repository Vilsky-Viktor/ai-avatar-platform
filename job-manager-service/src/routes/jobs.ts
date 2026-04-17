import { Router } from 'express';
import {
  genTrainingPhotoSet,
  genTrainingSyntheticFrontIdPhoto,
  genTrainingSyntheticIdPhotos,
  genTrainingTwinIdPhotos,
  restart,
  update,
  deleteById,
  deleteByAvatarId,
} from '../controllers/jobController';

const router = Router();

router.post('/gen-training-photo-set', genTrainingPhotoSet);
router.post('/gen-training-synthetic-front-id-photo', genTrainingSyntheticFrontIdPhoto);
router.post('/gen-training-synthetic-id-photos', genTrainingSyntheticIdPhotos);
router.post('/gen-training-twin-id-photos', genTrainingTwinIdPhotos);
router.post('/restart/:id', restart);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);

export default router;