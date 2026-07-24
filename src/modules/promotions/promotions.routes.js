const express = require('express');
const router = express.Router();
const promotionsController = require('./promotions.controller');
const { validatePromoCode, validateCreatePromoCode, validateUpdatePromoCode } = require('./promotions.validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorizeAdmin } = require('../../middleware/authorizeAdmin');

// Public: validate a promo code
router.post(
  '/promo-codes/validate',
  authenticate,
  validatePromoCode,
  validate,
  promotionsController.validatePromoCode
);

// Admin: CRUD for promo codes
router.get(
  '/admin/promo-codes',
  authenticate,
  authorizeAdmin,
  promotionsController.getAllPromoCodes
);

router.get(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  promotionsController.getPromoCodeById
);

router.post(
  '/admin/promo-codes',
  authenticate,
  authorizeAdmin,
  validateCreatePromoCode,
  validate,
  promotionsController.createPromoCode
);

router.put(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  validateUpdatePromoCode,
  validate,
  promotionsController.updatePromoCode
);

router.delete(
  '/admin/promo-codes/:id',
  authenticate,
  authorizeAdmin,
  promotionsController.deletePromoCode
);

module.exports = router;
