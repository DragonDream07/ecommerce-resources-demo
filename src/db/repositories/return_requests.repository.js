const db = require('../knex');

const TABLE = 'return_requests';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrderId = (orderId) =>
  db(TABLE).where({ order_id: orderId }).select('*');

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(TABLE)
    .where({ user_id: userId })
    .limit(limit)
    .offset(offset)
    .orderBy('created_at', 'desc');

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const query = db(TABLE).limit(limit).offset(offset).orderBy('created_at', 'desc');
  if (status !== undefined) query.where({ status });
  return query;
};

const create = (data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const updateById = (id, data, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query.where({ id }).update(data).returning('*').then((rows) => rows[0]);
};

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const findByOrderItemId = (orderItemId) =>
  db(TABLE).where({ order_item_id: orderItemId }).first();

const count = (filters = {}) => {
  const query = db(TABLE).count('id as total');
  if (filters.status !== undefined) query.where({ status: filters.status });
  return query.first();
};

module.exports = {
  findById,
  findByOrderId,
  findByUserId,
  findAll,
  create,
  updateById,
  deleteById,
  findByOrderItemId,
  count,
};
