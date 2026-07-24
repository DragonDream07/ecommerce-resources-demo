const express = require('express');
const router = express.Router();
const checkoutController = require('./checkout.controller');
const { validateStartCheckout, validateAddress, validatePlaceOrder } = require('./checkout.validator');
const { optionalAuth } = require('../../middleware/optionalAuth');

// Guest checkout support via optionalAuth middleware
router.post('/start', optionalAuth, validateStartCheckout, checkoutController.startCheckout);
router.post('/address', optionalAuth, validateAddress, checkoutController.submitAddress);
router.get('/review', optionalAuth, checkoutController.reviewCheckout);
router.post('/place-order', optionalAuth, validatePlaceOrder, checkoutController.placeOrder);

// Aliases for design-package compatibility
router.post('/initiate', optionalAuth, validateStartCheckout, checkoutController.startCheckout);
router.post('/confirm', optionalAuth, validatePlaceOrder, checkoutController.placeOrder);

module.exports = router;
