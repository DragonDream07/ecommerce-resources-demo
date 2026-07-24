'use strict';

const logger = require('../utils/logger');

/**
 * Centralised Express error handler.
 * Must be registered as the last middleware (after all routes).
 * Returns structured JSON error responses.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const error = err.error || httpStatusText(status);
  const message = err.message || 'An unexpected error occurred.';

  const details = err.details || undefined;

  if (status >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
    });
  } else {
    logger.warn({
      message: err.message,
      method: req.method,
      url: req.originalUrl,
      status,
    });
  }

  const body = { status, error, message };
  if (details !== undefined) {
    body.details = details;
  }

  return res.status(status).json(body);
}

function httpStatusText(code) {
  const map = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return map[code] || 'Error';
}

module.exports = errorHandler;
