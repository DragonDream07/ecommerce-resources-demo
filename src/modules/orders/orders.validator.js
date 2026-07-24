const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to collect and return validation errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * Validation rules for advancing an order status.
 */
const validateAdvanceOrder = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['confirmed', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'])
    .withMessage('Invalid order status value.'),

  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Note must not exceed 1000 characters.'),

  handleValidationErrors,
];

/**
 * Validation rules for cancelling an order.
 */
const validateCancelOrder = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.'),

  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required.')
    .isString()
    .withMessage('Cancellation reason must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Cancellation reason must not exceed 1000 characters.'),

  handleValidationErrors,
];

/**
 * Validation rules for submitting a return request.
 */
const validateReturnRequest = [
  param('orderId')
    .notEmpty()
    .withMessage('Order ID is required.'),

  body('reason')
    .notEmpty()
    .withMessage('Return reason is required.')
    .isString()
    .withMessage('Return reason must be a string.')
    .isLength({ max: 2000 })
    .withMessage('Return reason must not exceed 2000 characters.'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array.'),

  body('items.*.productId')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include a product ID.'),

  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include a quantity.')
    .isInt({ min: 1 })
    .withMessage('Return item quantity must be a positive integer.'),

  handleValidationErrors,
];

module.exports = {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
};
