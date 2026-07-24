const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return stack
    ? `${ts} [${level}]: ${message}\n${stack}`
    : `${ts} [${level}]: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
