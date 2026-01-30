import express from 'express';
import userRoutes from './routes/users';
import { errorHandler } from './middlewares/errorHandler';
import { validateAuth } from './middlewares/auth';
import admin from 'firebase-admin';

admin.initializeApp({
    projectId: process.env.PROJECT_ID,
});

const app = express();

app.use(express.json());

app.use('/users', validateAuth, userRoutes);

app.use(errorHandler);

export default app;