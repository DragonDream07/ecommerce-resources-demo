const cartService = require('./cart.service');
const { AppError } = require('../../utils/errors');

/**
 * POST /carts
 * Create a new cart (guest or authenticated).
 */
async function createCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.body.sessionId || null;
    const cart = await cartService.createCart({ userId, sessionId });
    return res.status(201).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /carts/:cartId
 * Retrieve a cart with its items and applied promo.
 */
async function getCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.query.sessionId || null;
    const cart = await cartService.getCart({ cartId, userId, sessionId });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/items
 * Add an item to the cart.
 */
async function addItem(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { productId, variantId, quantity } = req.body;
    const cart = await cartService.addItem({ cartId, userId, productId, variantId, quantity });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /carts/:cartId/items/:itemId
 * Update an existing cart item.
 */
async function updateItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { quantity } = req.body;
    const cart = await cartService.updateItem({ cartId, itemId, userId, quantity });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/items/:itemId
 * Remove an item from the cart.
 */
async function removeItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removeItem({ cartId, itemId, userId });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/promo
 * Apply a promo code to the cart.
 */
async function applyPromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { promoCode } = req.body;
    const cart = await cartService.applyPromo({ cartId, userId, promoCode });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/promo
 * Remove the applied promo code from the cart.
 */
async function removePromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removePromo({ cartId, userId });
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
