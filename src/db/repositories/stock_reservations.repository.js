const db = require('../knex');

const TABLE = 'stock_reservations';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).select('*');

const findBySkuId = (skuId) =>
  db(TABLE).where({ sku_id: skuId }).select('*');

const findActiveByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId, status: 'active' }).select('*');

const create = (data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const createMany = (dataArray, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.insert(dataArray).returning('*');
};

const updateById = (id, data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.where({ id }).update(data).returning('*').then((rows) => rows[0]);
};

const releaseByOrderId = (orderId, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query
    .where({ order_id: orderId, status: 'active' })
    .update({ status: 'released' })
    .returning('*');
};

const confirmByOrderId = (orderId, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query
    .where({ order_id: orderId, status: 'active' })
    .update({ status: 'confirmed' })
    .returning('*');
};

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const findExpired = (beforeDate) =>
  db(TABLE)
    .where({ status: 'active' })
    .where('expires_at', '<', beforeDate)
    .select('*');

module.exports = {
  findById,
  findByOrderId,
  findBySkuId,
  findActiveByOrderId,
  create,
  createMany,
  updateById,
  releaseByOrderId,
  confirmByOrderId,
  deleteById,
  findExpired,
};
