import { Router } from 'express';
import {
  getById,
  getBySlug,
  getAll,
  create,
  updateByAvatarId,
  deleteByAvatarId,
} from '../controllers/avatarController';

const router = Router();

router.get('/get/slug/:slug', getBySlug);
router.get('/get/avatar/:id', getById);
router.get('/get/all', getAll);
router.post('/create', create);
router.patch('/update/avatar/:id', updateByAvatarId);
router.delete('/delete/avatar/:id', deleteByAvatarId);

export default router;
