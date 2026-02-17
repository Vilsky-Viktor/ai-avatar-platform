import { Router } from 'express';
import {
  createIdPhoto,
  update,
  deleteById,
  deleteByAvatarId,
  deleteByUserId,
} from '../controllers/jobController';

const router = Router();

router.post('/create-id-photo', createIdPhoto);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);
router.delete('/delete-by-user-id/:userId', deleteByUserId);

export default router;