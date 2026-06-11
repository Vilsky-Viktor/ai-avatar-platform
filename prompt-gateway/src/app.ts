import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from '@loom24/shared/logger';
import { errorHandler } from '@loom24/shared/middlewares';
import idPhotoSelectorRoutes from './routes/idPhotoSelector';
import google from './services/google';

google.authenticate().catch((error) => {
    logger.error({ err: error }, 'Failed to authenticate Google AI');
    process.exit(1);
});

const app = express();

app.use(pinoHttp({ logger, autoLogging: false }));
app.use(cors());
app.use(express.json());

app.use('/prompt', idPhotoSelectorRoutes);

app.use(errorHandler);

export default app;
