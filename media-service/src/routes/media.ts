import { Router } from 'express';
import {
  create,
  deleteById,
  deleteByAvatarId,
  deleteByUserId,
} from '../controllers/mediaController';

const router = Router();

router.post('/create', create);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);
router.delete('/delete-by-user-id/:userId', deleteByUserId);

export default router;