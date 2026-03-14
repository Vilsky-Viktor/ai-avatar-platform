import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import admin from 'firebase-admin';
import pinoHttp from 'pino-http';
import logger from './logger';

admin.initializeApp({
    projectId: process.env.PROJECT_ID,
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.BUCKET_NAME
});

import upsamplerRoutes from './routes/upsampler';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(express.json());

app.use('/', upsamplerRoutes);

app.use(errorHandler);

export default app;