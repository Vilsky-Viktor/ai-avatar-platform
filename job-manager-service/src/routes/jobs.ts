import { Router } from 'express';
import {
  getByGroupId,
  genTrainingPhotoSet,
  genTrainingSyntheticFrontIdPhoto,
  genTrainingSyntheticIdPhotos,
  genTrainingTwinIdPhotos,
  restart,
  trainLoras,
  update,
  deleteById,
  deleteByAvatarId,
} from '../controllers/jobController';

const router = Router();

router.get('/get/group/:groupId', getByGroupId);
router.post('/gen-training-photo-set', genTrainingPhotoSet);
router.post('/gen-training-synthetic-front-id-photo', genTrainingSyntheticFrontIdPhoto);
router.post('/gen-training-synthetic-id-photos', genTrainingSyntheticIdPhotos);
router.post('/gen-training-twin-id-photos', genTrainingTwinIdPhotos);
router.post('/restart/:id', restart);
router.post('/train-loras/group/:groupId', trainLoras);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);

export default router;