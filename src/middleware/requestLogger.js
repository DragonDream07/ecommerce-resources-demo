'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * HTTP request logging middleware.
 * Uses Morgan to capture request details and streams
 * log output through the Winston logger.
 */

// Stream adapter so Morgan writes to Winston
const stream = {
  write(message) {
    // Morgan appends a newline; strip it before handing to Winston
    logger.http(message.trim());
  },
};

// Use 'combined' in production for full Apache-style logs;
// use 'dev' in other environments for concise coloured output.
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

const requestLogger = morgan(format, { stream });

module.exports = requestLogger;
