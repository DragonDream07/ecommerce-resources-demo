const { body, validationResult } = require('express-validator');

/**
 * Middleware that reads express-validator results and returns
 * a 422 response with the first validation error if present.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array({ onlyFirstError: true })[0];
    return res.status(422).json({ error: first.msg });
  }
  next();
}

// ---------------------------------------------------------------------------
// POST /carts — create cart
// ---------------------------------------------------------------------------
const validateCreateCart = [
  body('sessionId')
    .optional()
    .isString()
    .withMessage('sessionId must be a string.'),
  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /carts/:cartId/items — add item
// ---------------------------------------------------------------------------
const validateAddItem = [
  body('productId')
    .notEmpty()
    .withMessage('productId is required.')
    .isInt({ min: 1 })
    .withMessage('productId must be a positive integer.'),

  body('variantId')
    .notEmpty()
    .withMessage('variantId is required.')
    .isInt({ min: 1 })
    .withMessage('variantId must be a positive integer.'),

  body('quantity')
    .notEmpty()
    .withMessage('quantity is required.')
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive integer.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// PATCH /carts/:cartId/items/:itemId — update item
// ---------------------------------------------------------------------------
const validateUpdateItem = [
  body('quantity')
    .notEmpty()
    .withMessage('quantity is required.')
    .isInt({ min: 0 })
    .withMessage('quantity must be a non-negative integer.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /carts/:cartId/promo — apply promo code
// ---------------------------------------------------------------------------
const validateApplyPromo = [
  body('promoCode')
    .notEmpty()
    .withMessage('promoCode is required.')
    .isString()
    .withMessage('promoCode must be a string.')
    .isLength({ min: 1, max: 64 })
    .withMessage('promoCode must be between 1 and 64 characters.'),

  handleValidationErrors,
];

module.exports = {
  validateCreateCart,
  validateAddItem,
  validateUpdateItem,
  validateApplyPromo,
};
