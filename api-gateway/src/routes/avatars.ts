import { Router } from 'express';
import {
  getAllAvatars,
  createAvatar,
  updateAvatar,
  deleteAvatarById
} from '../controllers/avatarController';

const router = Router();

router.get('/get-all', getAllAvatars);
router.post('/create', createAvatar);
router.post('/update', updateAvatar);
router.delete('/delete-by-id/:id', deleteAvatarById);

export default router;