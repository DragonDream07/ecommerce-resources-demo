const checkoutService = require('./checkout.service');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * POST /checkout/start
 * Initiates a checkout session for authenticated or guest users.
 */
const startCheckout = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const guestEmail = req.body.guestEmail || null;
  const { cartId, promoCode } = req.body;

  const session = await checkoutService.startCheckout({ userId, guestEmail, cartId, promoCode });

  res.status(200).json({
    success: true,
    data: session,
  });
});

/**
 * POST /checkout/address
 * Submits and validates a shipping address for the active checkout session.
 */
const submitAddress = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId, shippingAddress, billingAddress, sameAsBilling } = req.body;

  const result = await checkoutService.submitAddress({
    userId,
    checkoutSessionId,
    shippingAddress,
    billingAddress,
    sameAsBilling,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /checkout/review
 * Returns the full order summary for the active checkout session.
 */
const reviewCheckout = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId } = req.query;

  const summary = await checkoutService.reviewCheckout({ userId, checkoutSessionId });

  res.status(200).json({
    success: true,
    data: summary,
  });
});

/**
 * POST /checkout/place-order
 * Finalises the checkout: confirms stock, applies promo, creates order, delegates payment.
 */
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId, paymentMethod, paymentDetails } = req.body;

  const order = await checkoutService.placeOrder({
    userId,
    checkoutSessionId,
    paymentMethod,
    paymentDetails,
  });

  res.status(201).json({
    success: true,
    data: order,
  });
});

module.exports = {
  startCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
