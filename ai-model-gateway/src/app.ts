import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import admin from 'firebase-admin';
import pinoHttp from 'pino-http';
import logger from './logger';
import { errorHandler } from './middlewares/errorHandler';
import falAi from './services/falAi';

admin.initializeApp({
    projectId: process.env.PROJECT_ID,
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.BUCKET_NAME
});

falAi.authenticate().catch((err) => {
    logger.error({ err }, 'Failed to authenticate fal.ai');
    process.exit(1);
});

import qwen from './routes/falAiQwen';
import flux from './routes/falAiflux';
import topaz from './routes/falAitopaz';
import kling from './routes/falAiKling';
import elevenLabs from './routes/falAiElevenLabs';
import syncLipsync from './routes/falAisyncLipsync';
import seedvr from './routes/falAiSeedvr';


const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(express.json());

app.use('/qwen', qwen);
app.use('/flux', flux);
app.use('/topaz', topaz);
app.use('/kling', kling);
app.use('/elevenlabs', elevenLabs);
app.use('/sync-lipsync', syncLipsync);
app.use('/seedvr', seedvr);

app.use(errorHandler);

export default app;