const db = require('../../db');

// Valid status transitions for order workflow
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

/**
 * List orders with optional filters.
 * @param {object} filters
 * @returns {Promise<object>}
 */
async function listOrders(filters) {
  const { status, page, limit, userId } = filters;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`o.status = $${idx++}`);
    params.push(status);
  }
  if (userId) {
    conditions.push(`o.user_id = $${idx++}`);
    params.push(userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM orders o ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const orderResult = await db.query(
    `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return {
    data: orderResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Retrieve a single order by ID, enforcing ownership for non-admins.
 * @param {string} orderId
 * @param {object} user
 * @returns {Promise<object|null>}
 */
async function getOrderById(orderId, user) {
  const result = await db.query(
    `SELECT o.*, json_agg(oi.*) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1
     GROUP BY o.id`,
    [orderId]
  );

  const order = result.rows[0] || null;
  if (!order) return null;

  if (user && user.role !== 'admin' && order.user_id !== user.id) {
    return null;
  }

  return order;
}

/**
 * Advance an order to a new status, recording the transition.
 * @param {string} orderId
 * @param {string} newStatus
 * @param {string} note
 * @param {object} actor
 * @returns {Promise<object>}
 */
async function advanceOrderStatus(orderId, newStatus, note, actor) {
  const order = await getOrderById(orderId, { role: 'admin' });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const allowed = STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Cannot transition order from '${order.status}' to '${newStatus}'.`
    );
    err.statusCode = 422;
    throw err;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, orderId]
    );

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note, actor_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [orderId, order.status, newStatus, note || null, actor ? actor.id : null]
    );

    if (newStatus === 'shipped') {
      await client.query(
        `UPDATE order_tracking SET status = 'in_transit', updated_at = NOW() WHERE order_id = $1`,
        [orderId]
      );
    } else if (newStatus === 'delivered') {
      await client.query(
        `UPDATE order_tracking SET status = 'delivered', updated_at = NOW() WHERE order_id = $1`,
        [orderId]
      );
    }

    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancel an order, recording the reason.
 * @param {string} orderId
 * @param {string} reason
 * @param {object} actor
 * @returns {Promise<object>}
 */
async function cancelOrder(orderId, reason, actor) {
  const order = await getOrderById(orderId, { role: 'admin' });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const cancellable = ['pending', 'confirmed', 'processing'];
  if (!cancellable.includes(order.status)) {
    const err = new Error(
      `Order cannot be cancelled in its current status '${order.status}'.`
    );
    err.statusCode = 422;
    throw err;
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE orders SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [reason || null, orderId]
    );

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note, actor_id, created_at)
       VALUES ($1, $2, 'cancelled', $3, $4, NOW())`,
      [orderId, order.status, reason || null, actor ? actor.id : null]
    );

    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Create a return request for an order.
 * @param {string} orderId
 * @param {object} payload
 * @param {object} actor
 * @returns {Promise<object>}
 */
async function createReturnRequest(orderId, payload, actor) {
  const order = await getOrderById(orderId, { role: 'admin' });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!['delivered', 'shipped'].includes(order.status)) {
    const err = new Error(
      'Return requests can only be submitted for delivered or shipped orders.'
    );
    err.statusCode = 422;
    throw err;
  }

  const { reason, items } = payload;

  const result = await db.query(
    `INSERT INTO return_requests (order_id, user_id, reason, items, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW()) RETURNING *`,
    [orderId, actor ? actor.id : null, reason, JSON.stringify(items || [])]
  );

  return result.rows[0];
}

/**
 * Retrieve tracking information for an order.
 * @param {string} orderId
 * @param {object} user
 * @returns {Promise<object|null>}
 */
async function getOrderTracking(orderId, user) {
  const order = await getOrderById(orderId, user);
  if (!order) return null;

  const result = await db.query(
    `SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );

  return result.rows[0] || null;
}

/**
 * Retrieve the status history (timeline) for an order.
 * @param {string} orderId
 * @param {object} user
 * @returns {Promise<Array>}
 */
async function getOrderTimeline(orderId, user) {
  const order = await getOrderById(orderId, user);
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const result = await db.query(
    `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );

  return result.rows;
}

/**
 * Retrieve refunds for an order.
 * @param {string} orderId
 * @param {object} user
 * @returns {Promise<Array>}
 */
async function getOrderRefunds(orderId, user) {
  const order = await getOrderById(orderId, user);
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const result = await db.query(
    `SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC`,
    [orderId]
  );

  return result.rows;
}

/**
 * Create an order — called by the checkout module.
 * @param {object} orderData
 * @returns {Promise<object>}
 */
async function createOrder(orderData) {
  const {
    userId,
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    totalAmount,
    currency,
    note,
  } = orderData;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders
         (user_id, status, shipping_address, billing_address, payment_method,
          total_amount, currency, note, created_at, updated_at)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        JSON.stringify(shippingAddress),
        JSON.stringify(billingAddress),
        paymentMethod,
        totalAmount,
        currency || 'USD',
        note || null,
      ]
    );

    const order = orderResult.rows[0];

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [order.id, item.productId, item.variantId || null, item.quantity, item.unitPrice]
        );
      }
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note, actor_id, created_at)
       VALUES ($1, NULL, 'pending', 'Order created', $2, NOW())`,
      [order.id, userId]
    );

    await client.query(
      `INSERT INTO order_tracking (order_id, status, created_at, updated_at)
       VALUES ($1, 'pending', NOW(), NOW())`,
      [order.id]
    );

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listOrders,
  getOrderById,
  advanceOrderStatus,
  cancelOrder,
  createReturnRequest,
  getOrderTracking,
  getOrderTimeline,
  getOrderRefunds,
  createOrder,
};
