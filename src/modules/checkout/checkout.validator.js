const { body, query, validationResult } = require('express-validator');

/**
 * Formats express-validator errors and sends a 422 response on failure.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  next();
}

/**
 * Validation for POST /checkout/start (alias: /checkout/initiate)
 */
const validateStartCheckout = [
  body('cartId')
    .notEmpty()
    .withMessage('Cart ID is required.')
    .isString()
    .withMessage('Cart ID must be a string.'),

  body('guestEmail')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('A valid email address is required for guest checkout.'),

  body('promoCode')
    .optional({ nullable: true })
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Promo code must not exceed 50 characters.'),

  handleValidationErrors,
];

/**
 * Address sub-rules reused for shipping and billing.
 */
function addressFieldRules(prefix) {
  return [
    body(`${prefix}.line1`)
      .notEmpty()
      .withMessage(`${prefix} line1 is required.`)
      .isString()
      .withMessage(`${prefix} line1 must be a string.`)
      .trim()
      .isLength({ max: 255 })
      .withMessage(`${prefix} line1 must not exceed 255 characters.`),

    body(`${prefix}.line2`)
      .optional({ nullable: true })
      .isString()
      .withMessage(`${prefix} line2 must be a string.`)
      .trim()
      .isLength({ max: 255 })
      .withMessage(`${prefix} line2 must not exceed 255 characters.`),

    body(`${prefix}.city`)
      .notEmpty()
      .withMessage(`${prefix} city is required.`)
      .isString()
      .withMessage(`${prefix} city must be a string.`)
      .trim()
      .isLength({ max: 100 })
      .withMessage(`${prefix} city must not exceed 100 characters.`),

    body(`${prefix}.state`)
      .optional({ nullable: true })
      .isString()
      .withMessage(`${prefix} state must be a string.`)
      .trim()
      .isLength({ max: 100 })
      .withMessage(`${prefix} state must not exceed 100 characters.`),

    body(`${prefix}.postalCode`)
      .notEmpty()
      .withMessage(`${prefix} postalCode is required.`)
      .isString()
      .withMessage(`${prefix} postalCode must be a string.`)
      .trim()
      .isLength({ max: 20 })
      .withMessage(`${prefix} postalCode must not exceed 20 characters.`),

    body(`${prefix}.country`)
      .notEmpty()
      .withMessage(`${prefix} country is required.`)
      .isString()
      .withMessage(`${prefix} country must be a string.`)
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage(`${prefix} country must be a valid 2-letter ISO country code.`),
  ];
}

/**
 * Validation for POST /checkout/address
 */
const validateAddress = [
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.')
    .isString()
    .withMessage('Checkout session ID must be a string.'),

  ...addressFieldRules('shippingAddress'),

  body('sameAsBilling')
    .optional()
    .isBoolean()
    .withMessage('sameAsBilling must be a boolean value.'),

  body('billingAddress')
    .if(body('sameAsBilling').not().equals('true'))
    .if(body('sameAsBilling').not().equals(true))
    .optional({ nullable: true }),

  ...addressFieldRules('billingAddress').map((rule) =>
    rule.if(body('sameAsBilling').not().equals(true))
  ),

  handleValidationErrors,
];

/**
 * Validation for POST /checkout/place-order (alias: /checkout/confirm)
 */
const validatePlaceOrder = [
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.')
    .isString()
    .withMessage('Checkout session ID must be a string.'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required.')
    .isString()
    .withMessage('Payment method must be a string.')
    .isIn(['card', 'paypal', 'bank_transfer', 'wallet'])
    .withMessage('Payment method must be one of: card, paypal, bank_transfer, wallet.'),

  body('paymentDetails')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Payment details must be an object.'),

  body('paymentDetails.token')
    .if(body('paymentMethod').equals('card'))
    .notEmpty()
    .withMessage('A payment token is required for card payments.')
    .isString()
    .withMessage('Payment token must be a string.'),

  handleValidationErrors,
];

/**
 * Validation for GET /checkout/review
 */
const validateReviewCheckout = [
  query('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.')
    .isString()
    .withMessage('Checkout session ID must be a string.'),

  handleValidationErrors,
];

module.exports = {
  validateStartCheckout,
  validateAddress,
  validatePlaceOrder,
  validateReviewCheckout,
};
