import { Router } from 'express';
import {
  getAll,
  create,
  update,
  updateCounterByFieldName,
  deleteByAvatarId,
  deleteByUserId,
} from '../controllers/avatarController';

const router = Router();

router.get('/get-all', getAll);
router.post('/create', create);
router.patch('/update/:id', update);
router.patch('/update-counter-by-field-name/:id', updateCounterByFieldName);
router.delete('/delete-by-avatar-id/:id', deleteByAvatarId);
router.delete('/delete-by-user-id/:userId', deleteByUserId);

export default router;