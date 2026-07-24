const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { validateCreateCart, validateAddItem, validateUpdateItem, validateApplyPromo } = require('./cart.validator');
const { optionalAuth, requireAuth } = require('../../middleware/auth');

// POST /carts — create a new cart (guest or authenticated)
router.post('/', optionalAuth, validateCreateCart, cartController.createCart);

// GET /carts/:cartId — retrieve cart by id
router.get('/:cartId', optionalAuth, cartController.getCart);

// POST /carts/:cartId/items — add item to cart
router.post('/:cartId/items', optionalAuth, validateAddItem, cartController.addItem);

// PATCH /carts/:cartId/items/:itemId — update cart item (quantity, etc.)
router.patch('/:cartId/items/:itemId', optionalAuth, validateUpdateItem, cartController.updateItem);

// DELETE /carts/:cartId/items/:itemId — remove item from cart
router.delete('/:cartId/items/:itemId', optionalAuth, cartController.removeItem);

// POST /carts/:cartId/promo — apply promo code
router.post('/:cartId/promo', optionalAuth, validateApplyPromo, cartController.applyPromo);

// DELETE /carts/:cartId/promo — remove promo code
router.delete('/:cartId/promo', optionalAuth, cartController.removePromo);

module.exports = router;
