const db = require('../knex');

const TABLE = 'refunds';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');

const findByGatewayRefundId = (gatewayRefundId) =>
  db(TABLE).where({ gateway_refund_id: gatewayRefundId }).first();

const findByPaymentAttemptId = (paymentAttemptId) =>
  db(TABLE).where({ payment_attempt_id: paymentAttemptId }).select('*');

const create = (data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const updateById = (id, data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.where({ id }).update(data).returning('*').then((rows) => rows[0]);
};

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const query = db(TABLE).limit(limit).offset(offset).orderBy('created_at', 'desc');
  if (status !== undefined) query.where({ status });
  return query;
};

const sumRefundedByOrderId = (orderId) =>
  db(TABLE)
    .where({ order_id: orderId, status: 'processed' })
    .sum('amount as total')
    .first();

module.exports = {
  findById,
  findByOrderId,
  findByGatewayRefundId,
  findByPaymentAttemptId,
  create,
  updateById,
  findAll,
  sumRefundedByOrderId,
};
