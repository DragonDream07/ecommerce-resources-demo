'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication routes (login, register).
 * Allows up to 10 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for password-reset routes.
 * Allows up to 5 requests per 60-minute window per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many password-reset attempts. Please try again after 60 minutes.',
  },
  skipSuccessfulRequests: false,
});

module.exports = { authLimiter, passwordResetLimiter };
