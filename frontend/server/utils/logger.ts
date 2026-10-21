import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
        ? {
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
              },
          }
        : undefined,
});

function sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'session'];
    const sanitized = { ...data };

    for (const key in sanitized) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    }

    return sanitized;
}

export const log = {
    debug: (message: string, data?: any) => {
        logger.debug(sanitizeData(data), message);
    },
    info: (message: string, data?: any) => {
        logger.info(sanitizeData(data), message);
    },
    warn: (message: string, data?: any) => {
        logger.warn(sanitizeData(data), message);
    },
    error: (message: string, error?: any, data?: any) => {
        const errorData = error instanceof Error
            ? {
                  message: error.message,
                  stack: error.stack,
                  ...sanitizeData(data),
              }
            : sanitizeData({ error, ...data });
        logger.error(errorData, message);
    },
};

export default logger;

