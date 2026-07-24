const db = require('../../config/db');

/**
 * Fetches a promo code record by its code string.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
async function findPromoCodeByCode(code) {
  const [rows] = await db.query(
    'SELECT * FROM promo_codes WHERE code = ? LIMIT 1',
    [code]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Fetches a promo code record by its ID.
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
async function getPromoCodeById(id) {
  const [rows] = await db.query(
    'SELECT * FROM promo_codes WHERE id = ? LIMIT 1',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Returns paginated list of all promo codes, optionally filtered by status.
 * @param {{ page: number, limit: number, status?: string }} options
 * @returns {Promise<{ items: object[], total: number, page: number, limit: number }>}
 */
async function getAllPromoCodes({ page = 1, limit = 20, status } = {}) {
  const offset = (page - 1) * limit;
  let whereClause = '';
  const params = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM promo_codes ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await db.query(
    `SELECT * FROM promo_codes ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { items: rows, total, page, limit };
}

/**
 * Checks how many times a user has already used a specific promo code.
 * @param {string|number} promoCodeId
 * @param {string|number} userId
 * @returns {Promise<number>}
 */
async function getUserUsageCount(promoCodeId, userId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS count FROM promo_code_usages WHERE promo_code_id = ? AND user_id = ?',
    [promoCodeId, userId]
  );
  return rows[0].count;
}

/**
 * Checks global usage count for a promo code.
 * @param {string|number} promoCodeId
 * @returns {Promise<number>}
 */
async function getGlobalUsageCount(promoCodeId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS count FROM promo_code_usages WHERE promo_code_id = ?',
    [promoCodeId]
  );
  return rows[0].count;
}

/**
 * Calculates the discount amount based on promo code type.
 * @param {object} promoCode
 * @param {number} orderTotal
 * @returns {number} discount amount
 */
function calculateDiscount(promoCode, orderTotal) {
  if (promoCode.discount_type === 'percentage') {
    const discount = (promoCode.discount_value / 100) * orderTotal;
    if (promoCode.max_discount_amount && discount > promoCode.max_discount_amount) {
      return promoCode.max_discount_amount;
    }
    return Math.round(discount * 100) / 100;
  }

  if (promoCode.discount_type === 'fixed') {
    return Math.min(promoCode.discount_value, orderTotal);
  }

  return 0;
}

/**
 * Validates a promo code for a user and order, and returns discount info.
 * @param {string} code
 * @param {number} orderTotal
 * @param {string|number} userId
 * @returns {Promise<{ valid: boolean, message?: string, discountAmount?: number, finalTotal?: number, promoCodeId?: number }>}
 */
async function validateAndCalculateDiscount(code, orderTotal, userId) {
  const promoCode = await findPromoCodeByCode(code);

  if (!promoCode) {
    return { valid: false, message: 'Invalid promo code.' };
  }

  if (promoCode.status !== 'active') {
    return { valid: false, message: 'This promo code is no longer active.' };
  }

  const now = new Date();
  if (promoCode.starts_at && new Date(promoCode.starts_at) > now) {
    return { valid: false, message: 'This promo code is not yet valid.' };
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at) < now) {
    return { valid: false, message: 'This promo code has expired.' };
  }

  if (promoCode.min_order_amount && orderTotal < promoCode.min_order_amount) {
    return {
      valid: false,
      message: `A minimum order of ${promoCode.min_order_amount} is required to use this promo code.`,
    };
  }

  if (promoCode.max_uses !== null && promoCode.max_uses !== undefined) {
    const globalUsage = await getGlobalUsageCount(promoCode.id);
    if (globalUsage >= promoCode.max_uses) {
      return { valid: false, message: 'This promo code has reached its usage limit.' };
    }
  }

  if (promoCode.max_uses_per_user !== null && promoCode.max_uses_per_user !== undefined) {
    const userUsage = await getUserUsageCount(promoCode.id, userId);
    if (userUsage >= promoCode.max_uses_per_user) {
      return { valid: false, message: 'You have already used this promo code the maximum number of times.' };
    }
  }

  const discountAmount = calculateDiscount(promoCode, orderTotal);
  const finalTotal = Math.max(0, orderTotal - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalTotal,
    promoCodeId: promoCode.id,
    discountType: promoCode.discount_type,
    discountValue: promoCode.discount_value,
  };
}

/**
 * Records a promo code usage after a successful order.
 * @param {string|number} promoCodeId
 * @param {string|number} userId
 * @param {string|number} orderId
 * @returns {Promise<void>}
 */
async function recordPromoUsage(promoCodeId, userId, orderId) {
  await db.query(
    'INSERT INTO promo_code_usages (promo_code_id, user_id, order_id) VALUES (?, ?, ?)',
    [promoCodeId, userId, orderId]
  );
}

/**
 * Creates a new promo code.
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function createPromoCode(payload) {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    max_uses,
    max_uses_per_user,
    starts_at,
    expires_at,
    status = 'active',
  } = payload;

  const [result] = await db.query(
    `INSERT INTO promo_codes
      (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, max_uses, max_uses_per_user, starts_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      description || null,
      discount_type,
      discount_value,
      min_order_amount || null,
      max_discount_amount || null,
      max_uses || null,
      max_uses_per_user || null,
      starts_at || null,
      expires_at || null,
      status,
    ]
  );

  return getPromoCodeById(result.insertId);
}

/**
 * Updates an existing promo code.
 * @param {string|number} id
 * @param {object} payload
 * @returns {Promise<object|null>}
 */
async function updatePromoCode(id, payload) {
  const existing = await getPromoCodeById(id);
  if (!existing) return null;

  const fields = [
    'code',
    'description',
    'discount_type',
    'discount_value',
    'min_order_amount',
    'max_discount_amount',
    'max_uses',
    'max_uses_per_user',
    'starts_at',
    'expires_at',
    'status',
  ];

  const updates = [];
  const values = [];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(payload[field]);
    }
  });

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);
  await db.query(
    `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getPromoCodeById(id);
}

/**
 * Deletes a promo code by ID.
 * @param {string|number} id
 * @returns {Promise<boolean>}
 */
async function deletePromoCode(id) {
  const existing = await getPromoCodeById(id);
  if (!existing) return false;

  await db.query('DELETE FROM promo_codes WHERE id = ?', [id]);
  return true;
}

module.exports = {
  validateAndCalculateDiscount,
  recordPromoUsage,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
