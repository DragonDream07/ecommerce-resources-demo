const db = require('../../db');
const { AppError } = require('../../utils/errors');

const RETURNABLE_STATUSES = ['delivered'];
const RETURN_WINDOW_DAYS = 30;
const ALLOWED_REVIEW_DECISIONS = ['approved', 'rejected'];

/**
 * Check that an order exists, belongs to the user, is in a returnable state,
 * and is within the return window.
 */
async function checkReturnEligibility(orderId, userId) {
  const order = await db('orders').where({ id: orderId }).first();
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  if (String(order.user_id) !== String(userId)) {
    throw new AppError('You do not have permission to return this order.', 403);
  }
  if (!RETURNABLE_STATUSES.includes(order.status)) {
    throw new AppError('This order is not eligible for a return.', 422);
  }
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at);
  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - deliveredAt.getTime() > windowMs) {
    throw new AppError('The return window for this order has expired.', 422);
  }
  return order;
}

/**
 * Create a new return request for an order.
 */
async function createReturnRequest(orderId, userId, payload) {
  await checkReturnEligibility(orderId, userId);

  const existing = await db('return_requests')
    .where({ order_id: orderId, status: ['pending', 'approved'] })
    .first();
  if (existing) {
    throw new AppError('A return request for this order already exists.', 409);
  }

  const { reason, items } = payload;

  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: userId,
      reason,
      items: items ? JSON.stringify(items) : null,
      status: 'pending',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return returnRequest;
}

/**
 * Get a specific return request by ID, scoped to an order and user.
 */
async function getReturnRequestByOrder(returnRequestId, orderId, userId) {
  const returnRequest = await db('return_requests')
    .where({ id: returnRequestId, order_id: orderId, user_id: userId })
    .first();
  if (!returnRequest) {
    throw new AppError('Return request not found.', 404);
  }
  return returnRequest;
}

/**
 * Admin: list all return requests with optional filters and pagination.
 */
async function listReturnRequests(filters = {}) {
  const { status, order_id, user_id, page = 1, limit = 20 } = filters;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const query = db('return_requests').orderBy('created_at', 'desc');

  if (status) query.where({ status });
  if (order_id) query.where({ order_id });
  if (user_id) query.where({ user_id });

  const totalQuery = query.clone().count('id as count').first();
  const [totalResult, rows] = await Promise.all([
    totalQuery,
    query.clone().limit(limitNum).offset(offset).select('*'),
  ]);

  const total = parseInt(totalResult.count, 10);

  return {
    data: rows,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Admin: get a specific return request by ID.
 */
async function getReturnRequest(returnRequestId) {
  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new AppError('Return request not found.', 404);
  }
  return returnRequest;
}

/**
 * Admin: approve or reject a return request.
 * On approval: trigger refund and update stock.
 */
async function reviewReturnRequest(returnRequestId, adminId, payload) {
  const { decision, notes } = payload;

  if (!ALLOWED_REVIEW_DECISIONS.includes(decision)) {
    throw new AppError('Decision must be either approved or rejected.', 422);
  }

  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();
  if (!returnRequest) {
    throw new AppError('Return request not found.', 404);
  }
  if (returnRequest.status !== 'pending') {
    throw new AppError('Only pending return requests can be reviewed.', 422);
  }

  const trx = await db.transaction();
  try {
    const [updated] = await trx('return_requests')
      .where({ id: returnRequestId })
      .update({
        status: decision,
        reviewed_by: adminId,
        review_notes: notes || null,
        reviewed_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('*');

    if (decision === 'approved') {
      await triggerRefund(trx, returnRequest);
      await restoreStock(trx, returnRequest);
    }

    await trx.commit();
    return updated;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Trigger a refund for the approved return request.
 * Updates the associated order's refund status.
 */
async function triggerRefund(trx, returnRequest) {
  await trx('orders')
    .where({ id: returnRequest.order_id })
    .update({
      refund_status: 'refund_initiated',
      updated_at: trx.fn.now(),
    });
}

/**
 * Restore stock for items in the approved return request.
 */
async function restoreStock(trx, returnRequest) {
  let items = returnRequest.items;
  if (!items) {
    // Fall back to order items if no specific items listed
    items = await trx('order_items').where({ order_id: returnRequest.order_id }).select('product_id', 'quantity');
  } else {
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }
  }

  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    await trx('products')
      .where({ id: item.product_id })
      .increment('stock_quantity', item.quantity || 1);
  }
}

module.exports = {
  createReturnRequest,
  getReturnRequestByOrder,
  listReturnRequests,
  getReturnRequest,
  reviewReturnRequest,
};
