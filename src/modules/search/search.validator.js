const { query, validationResult } = require('express-validator');

/**
 * Middleware to collect validation errors and respond with 422 if any exist.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  return next();
}

/**
 * Validation rules for GET /search
 */
const validateSearchQuery = [
  query('q')
    .optional()
    .isString()
    .withMessage('q must be a string')
    .isLength({ max: 500 })
    .withMessage('q must not exceed 500 characters'),

  query('filters')
    .optional()
    .isString()
    .withMessage('filters must be a JSON string')
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('filters must be a JSON object');
        }
        return true;
      } catch {
        throw new Error('filters must be a valid JSON object string');
      }
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('size must be an integer between 1 and 100')
    .toInt(),

  handleValidationErrors,
];

/**
 * Validation rules for GET /search/autocomplete
 */
const validateSuggestQuery = [
  query('q')
    .notEmpty()
    .withMessage('q is required')
    .isString()
    .withMessage('q must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('q must be between 1 and 200 characters'),

  query('size')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('size must be an integer between 1 and 20')
    .toInt(),

  handleValidationErrors,
];

module.exports = { validateSearchQuery, validateSuggestQuery };
