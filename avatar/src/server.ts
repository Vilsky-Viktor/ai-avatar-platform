import app from './app';
import config from './config/config';
import logger from '@loom24/shared/logger';

app.listen(config.port, () => {
  logger.info(`[${process.env.SERVICE_NAME || 'avatar'}] running on port ${config.port}`);
});