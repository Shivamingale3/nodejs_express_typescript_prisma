import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import { LOG_DIR } from '@config';

// logs dir — resolve relative to project root (cwd), not __dirname
const logDir: string = resolve(process.cwd(), LOG_DIR || 'logs');

// Ensure log directories exist
['debug', 'error'].forEach(level => {
  const dir = `${logDir}/${level}`;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/debug`,
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      maxSize: '20m',
      zippedArchive: false,
    }),
    // error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`,
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      maxSize: '20m',
      handleExceptions: true,
      zippedArchive: false,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
