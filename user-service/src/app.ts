import express from 'express';
import testRoutes from './routes/test';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use('/test', testRoutes);

app.use(errorHandler);

export default app;