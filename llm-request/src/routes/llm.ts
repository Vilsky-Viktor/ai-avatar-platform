import { Router } from 'express';
import { getPersonCharacteristics } from '../controllers/llmController';

const router = Router();

router.post('/get-person-characteristics', getPersonCharacteristics);

export default router;