import { Router } from 'express';
import { selectIdPhotos } from '../controllers/idPhotoSelectorController';

const router = Router();

router.post('/select-id-photos', selectIdPhotos);

export default router;
