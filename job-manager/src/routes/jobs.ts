import { Router } from 'express';
import { getById, getByGroupId, getByAvatarId, getCountsByAvatarId, restart, update, deleteById, deleteByAvatarId } from '../controllers/jobController';
import { genSyntheticFrontIdPhoto, genSyntheticIdPhotos, genDigitalTwinIdPhotos } from '../controllers/idPhotoController';
import { genAvatarAudio, genAvatarPhoto, genAvatarPhotoSet, genAvatarVideo, mimicMotion } from '../controllers/contentController';

const router = Router();


router.post('/gen-synthetic-front-id-photo', genSyntheticFrontIdPhoto);
router.post('/gen-synthetic-id-photos', genSyntheticIdPhotos);
router.post('/gen-digital-twin-id-photos', genDigitalTwinIdPhotos);

router.post('/gen-avatar-photo', genAvatarPhoto);
router.post('/gen-avatar-photo-set', genAvatarPhotoSet);
router.post('/gen-avatar-video', genAvatarVideo);
router.post('/mimic-motion', mimicMotion);
router.post('/gen-avatar-audio', genAvatarAudio);

router.get('/get/job/:id', getById);
router.get('/get/group/:groupId', getByGroupId);
router.get('/get/avatar/:avatarId', getByAvatarId);
router.get('/counts/avatar/:avatarId', getCountsByAvatarId);
router.post('/restart/job/:id', restart);
router.patch('/update/job/:id', update);
router.delete('/delete/job/:id', deleteById);
router.delete('/delete/avatar/:avatarId', deleteByAvatarId);

export default router;
