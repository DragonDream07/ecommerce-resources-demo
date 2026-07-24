/**
 * Wraps an async Express route handler and forwards any rejected promise
 * or thrown error to the next() error-handling middleware.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
