import { Router } from 'express';
import {
  genTrainingPhotoSet,
  genTrainingIdPhotos,
  genTrainingIdPhotosFromUploaded,
  restart,
  update,
  deleteById,
  deleteByAvatarId,
} from '../controllers/jobController';

const router = Router();

router.post('/gen-training-photo-set', genTrainingPhotoSet);
router.post('/gen-training-id-photos', genTrainingIdPhotos);
router.post('/gen-training-id-photos-from-uploaded', genTrainingIdPhotosFromUploaded);
router.post('/restart/:id', restart);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);

export default router;