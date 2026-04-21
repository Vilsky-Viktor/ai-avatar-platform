import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname,req,res',
  singleLine: true,
  customPrettifiers: {
    level: (label) => `[${label.toString().toUpperCase()}]`,
    time: (timestamp) => (timestamp as string).replace(/[\[\]]/g, '')
  },
  messageFormat: '{msg}'
});

const logger = pino({
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
}, stream);

export default logger;