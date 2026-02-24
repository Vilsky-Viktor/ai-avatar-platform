import { Router } from 'express';
import {
  createIdPhotoView0,
  createIdPhotoView45,
  createIdPhotoView90,
  createPhotoSet,
  update,
  deleteById,
  deleteByAvatarId,
  deleteByUserId,
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo-view0', createIdPhotoView0);
router.post('/create-id-photo-view45', createIdPhotoView45);
router.post('/create-id-photo-view90', createIdPhotoView90);
router.post('/create-photo-set', createPhotoSet);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);
router.delete('/delete-by-user-id/:userId', deleteByUserId);

export default router;