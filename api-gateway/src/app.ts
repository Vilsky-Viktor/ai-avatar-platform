import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import userRoutes from './routes/users';
import avatarRoutes from './routes/avatars';
import jobRoutes from './routes/jobs';
import { errorHandler } from './middlewares/errorHandler';
import { validateAuth } from './middlewares/auth';
import admin from 'firebase-admin';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './logger';

admin.initializeApp({
    projectId: process.env.PROJECT_ID,
    credential: admin.credential.applicationDefault()
});

const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(cors());
app.use(express.json());

app.use('/users', validateAuth, userRoutes);
app.use('/avatars', validateAuth, avatarRoutes);
app.use('/jobs', validateAuth, jobRoutes);

app.use(errorHandler);

export default app;