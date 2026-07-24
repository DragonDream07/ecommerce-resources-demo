const db = require('../knex');

const TABLE = 'payment_attempts';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc');

const findByGatewayOrderId = (gatewayOrderId) =>
  db(TABLE).where({ gateway_order_id: gatewayOrderId }).first();

const findByGatewayPaymentId = (gatewayPaymentId) =>
  db(TABLE).where({ gateway_payment_id: gatewayPaymentId }).first();

const findLatestByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).orderBy('created_at', 'desc').first();

const create = (data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const updateById = (id, data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.where({ id }).update(data).returning('*').then((rows) => rows[0]);
};

const updateByGatewayOrderId = (gatewayOrderId, data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.where({ gateway_order_id: gatewayOrderId }).update(data).returning('*').then((rows) => rows[0]);
};

const findSuccessfulByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId, status: 'success' }).first();

module.exports = {
  findById,
  findByOrderId,
  findByGatewayOrderId,
  findByGatewayPaymentId,
  findLatestByOrderId,
  create,
  updateById,
  updateByGatewayOrderId,
  findSuccessfulByOrderId,
};
