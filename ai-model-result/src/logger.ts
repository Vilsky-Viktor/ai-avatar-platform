import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname',
  singleLine: true,
  hideObject: false,
  customPrettifiers: {
    level: (label) => `[${label.toString().toUpperCase()}]`,
    time: (timestamp) => (timestamp as string).replace(/[\[\]]/g, '')
  },
  messageFormat: '{msg}'
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    redact: ['result.token', 'credentials'] 
  },
  stream
);

export default logger;