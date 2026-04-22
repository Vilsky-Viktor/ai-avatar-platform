import { Router } from 'express';
import {
  getById,
  getBySlug,
  getAll,
  create,
  update,
  deleteByAvatarId,
} from '../controllers/avatarController';

const router = Router();

router.get('/get/:id', getById);
router.get('/get/slug/:slug', getBySlug);
router.get('/get-all', getAll);
router.post('/create', create);
router.patch('/update/:id', update);
router.delete('/delete-by-avatar-id/:id', deleteByAvatarId);

export default router;