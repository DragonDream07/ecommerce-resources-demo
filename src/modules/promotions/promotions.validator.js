const { body } = require('express-validator');

/**
 * Validation schema for validating a promo code (public endpoint).
 */
const validatePromoCode = [
  body('code')
    .exists({ checkFalsy: true })
    .withMessage('Promo code is required.')
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Promo code must be between 1 and 100 characters.'),

  body('orderTotal')
    .exists({ checkNull: true })
    .withMessage('Order total is required.')
    .isFloat({ min: 0 })
    .withMessage('Order total must be a non-negative number.'),
];

/**
 * Validation schema for creating a new promo code (admin endpoint).
 */
const validateCreatePromoCode = [
  body('code')
    .exists({ checkFalsy: true })
    .withMessage('Promo code is required.')
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Promo code must be between 1 and 100 characters.')
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage('Promo code may only contain letters, numbers, hyphens, and underscores.'),

  body('discount_type')
    .exists({ checkFalsy: true })
    .withMessage('Discount type is required.')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either "percentage" or "fixed".'),

  body('discount_value')
    .exists({ checkNull: true })
    .withMessage('Discount value is required.')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.')
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters.'),

  body('min_order_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number.'),

  body('max_discount_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a non-negative number.'),

  body('max_uses')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum uses must be a positive integer.'),

  body('max_uses_per_user')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum uses per user must be a positive integer.'),

  body('starts_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date.'),

  body('expires_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date.')
    .custom((value, { req }) => {
      if (value && req.body.starts_at && new Date(value) <= new Date(req.body.starts_at)) {
        throw new Error('Expiry date must be after the start date.');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either "active" or "inactive".'),
];

/**
 * Validation schema for updating an existing promo code (admin endpoint).
 * All fields are optional but must be valid if provided.
 */
const validateUpdatePromoCode = [
  body('code')
    .optional()
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Promo code must be between 1 and 100 characters.')
    .matches(/^[A-Za-z0-9_\-]+$/)
    .withMessage('Promo code may only contain letters, numbers, hyphens, and underscores.'),

  body('discount_type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either "percentage" or "fixed".'),

  body('discount_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number.'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string.')
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters.'),

  body('min_order_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number.'),

  body('max_discount_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a non-negative number.'),

  body('max_uses')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum uses must be a positive integer.'),

  body('max_uses_per_user')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Maximum uses per user must be a positive integer.'),

  body('starts_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date.'),

  body('expires_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date.')
    .custom((value, { req }) => {
      if (value && req.body.starts_at && new Date(value) <= new Date(req.body.starts_at)) {
        throw new Error('Expiry date must be after the start date.');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either "active" or "inactive".'),
];

module.exports = {
  validatePromoCode,
  validateCreatePromoCode,
  validateUpdatePromoCode,
};
