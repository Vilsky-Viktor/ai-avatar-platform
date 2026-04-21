import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import admin from 'firebase-admin';
import pinoHttp from 'pino-http';
import logger from './logger';

admin.initializeApp({
    projectId: process.env.PROJECT_ID,
    credential: admin.credential.applicationDefault()
});

import runpodRoutes from './routes/runpod';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(express.json());

app.use('/', runpodRoutes);

app.use(errorHandler);

export default app;