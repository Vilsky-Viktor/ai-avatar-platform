import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname,req,res',
  singleLine: true,
  customPrettifiers: {
    level: (label) => `[${label.toString().toUpperCase()}]`,
    time: (timestamp) => (timestamp as string).replace(/[\[\]]/g, ''),
  },
  messageFormat: '{msg}',
});

const baseLogger = pino({
  formatters: {
    level: (label) => ({ level: label }),
  },
}, stream);

const storage = new AsyncLocalStorage<pino.Logger>();

export const setLogContext = (userId?: string, avatarId?: string, jobId?: string): void => {
  const context: Record<string, string> = {};
  if (userId) context.userId = userId;
  if (avatarId) context.avatarId = avatarId;
  if (jobId) context.jobId = jobId;
  const child = Object.keys(context).length ? baseLogger.child(context) : baseLogger;
  storage.enterWith(child);
};

export const clearLogContext = (): void => {
  storage.enterWith(baseLogger);
};

const logger = new Proxy(baseLogger, {
  get(_target, prop) {
    const active = storage.getStore() ?? baseLogger;
    return (active as any)[prop];
  },
});

export default logger;
