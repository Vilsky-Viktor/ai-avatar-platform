import { Router } from 'express';
import { getById, getByGroupId, getByAvatarId, restart, update, deleteById, deleteByAvatarId } from '../controllers/jobController';
import { genSyntheticFrontIdPhoto, genSyntheticIdPhotos, genDigitalTwinIdPhotos } from '../controllers/idPhotoController';
import { genAvatarAudio, genAvatarPhoto, genAvatarPhotoSet, genAvatarVideo } from '../controllers/contentController';

const router = Router();


router.post('/gen-synthetic-front-id-photo', genSyntheticFrontIdPhoto);
router.post('/gen-synthetic-id-photos', genSyntheticIdPhotos);
router.post('/gen-digital-twin-id-photos', genDigitalTwinIdPhotos);

router.post('/gen-avatar-photo', genAvatarPhoto);
router.post('/gen-avatar-photo-set', genAvatarPhotoSet);
router.post('/gen-avatar-video', genAvatarVideo);
router.post('/gen-avatar-audio', genAvatarAudio);

router.get('/get/id/:id', getById);
router.get('/get/group/:groupId', getByGroupId);
router.get('/get/avatar/:avatarId', getByAvatarId);
router.post('/restart/:id', restart);
router.patch('/update/:id', update);
router.delete('/delete-by-id/:id', deleteById);
router.delete('/delete-by-avatar-id/:avatarId', deleteByAvatarId);

export default router;