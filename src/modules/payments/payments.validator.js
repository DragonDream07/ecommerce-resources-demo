const { body, param, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Helper — runs express-validator results and short-circuits with 422 on error
// ---------------------------------------------------------------------------
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ---------------------------------------------------------------------------
// POST /payments/initiate
// ---------------------------------------------------------------------------
const validateInitiatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter ISO 4217 code.')
    .toUpperCase(),

  body('provider')
    .optional()
    .isString()
    .withMessage('Provider must be a string.'),

  body('orderId')
    .optional()
    .isString()
    .withMessage('Order ID must be a string.'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /payments/callback  (also /payments/webhook)
// ---------------------------------------------------------------------------
const validateCallback = [
  body('providerReference')
    .optional()
    .isString()
    .withMessage('Provider reference must be a string.'),

  body('paymentId')
    .optional()
    .isString()
    .withMessage('Payment ID must be a string.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isString()
    .withMessage('Status must be a string.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /payments/:paymentId/retry
// ---------------------------------------------------------------------------
const validateRetry = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required.')
    .isString()
    .withMessage('Payment ID must be a string.'),

  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter ISO 4217 code.')
    .toUpperCase(),

  handleValidationErrors,
];

module.exports = {
  validateInitiatePayment,
  validateCallback,
  validateRetry,
};
