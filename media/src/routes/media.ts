import { Router } from 'express';
import {
  getByAvatarId,
  create,
  createTrainingMedia,
  deleteById,
  deleteByAvatarId,
} from '../controllers/mediaController';

const router = Router();

router.get('/get/avatar/:id', getByAvatarId);
router.post('/create', create);
router.post('/create-training/:groupId', createTrainingMedia);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);

export default router;