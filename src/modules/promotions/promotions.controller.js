const promotionsService = require('./promotions.service');

/**
 * POST /promo-codes/validate
 * Validates a promo code for the authenticated user and returns discount info.
 */
async function validatePromoCode(req, res, next) {
  try {
    const { code, orderTotal, userId } = req.body;
    const effectiveUserId = userId || req.user.id;
    const result = await promotionsService.validateAndCalculateDiscount(code, orderTotal, effectiveUserId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/promo-codes
 * Returns all promo codes (admin only).
 */
async function getAllPromoCodes(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await promotionsService.getAllPromoCodes({ page: Number(page), limit: Number(limit), status });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/promo-codes/:id
 * Returns a single promo code by ID (admin only).
 */
async function getPromoCodeById(req, res, next) {
  try {
    const { id } = req.params;
    const promoCode = await promotionsService.getPromoCodeById(id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: promoCode });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/promo-codes
 * Creates a new promo code (admin only).
 */
async function createPromoCode(req, res, next) {
  try {
    const payload = req.body;
    const created = await promotionsService.createPromoCode(payload);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /admin/promo-codes/:id
 * Updates an existing promo code (admin only).
 */
async function updatePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await promotionsService.updatePromoCode(id, payload);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /admin/promo-codes/:id
 * Deletes a promo code (admin only).
 */
async function deletePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await promotionsService.deletePromoCode(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validatePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
