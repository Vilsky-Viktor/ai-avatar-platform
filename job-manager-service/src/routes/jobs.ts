import { Router } from 'express';
import {
  createPhotoSet,
  restart,
  update,
  deleteById,
  deleteByAvatarId,
  deleteByUserId,
} from '../controllers/jobController';

const router = Router();

router.post('/create-photo-set', createPhotoSet);
router.post('/restart/:id', restart);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);
router.delete('/delete-by-user-id/:userId', deleteByUserId);

export default router;