const db = require('../knex');

const ORDERS_TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const HISTORY_TABLE = 'order_status_history';
const TRACKING_TABLE = 'order_tracking';

// Orders
const findById = (id) =>
  db(ORDERS_TABLE).where({ id }).first();

const findByOrderNumber = (orderNumber) =>
  db(ORDERS_TABLE).where({ order_number: orderNumber }).first();

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(ORDERS_TABLE)
    .where({ user_id: userId })
    .limit(limit)
    .offset(offset)
    .orderBy('created_at', 'desc');

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const query = db(ORDERS_TABLE).limit(limit).offset(offset).orderBy('created_at', 'desc');
  if (status !== undefined) query.where({ status });
  return query;
};

const create = (data, trx) => {
  const query = trx ? trx(ORDERS_TABLE) : db(ORDERS_TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const updateById = (id, data, trx) => {
  const query = trx ? trx(ORDERS_TABLE) : db(ORDERS_TABLE);
  return query.where({ id }).update(data).returning('*').then((rows) => rows[0]);
};

const count = (filters = {}) => {
  const query = db(ORDERS_TABLE).count('id as total');
  if (filters.status !== undefined) query.where({ status: filters.status });
  return query.first();
};

// Order Items
const findItemsByOrderId = (orderId) =>
  db(ITEMS_TABLE).where({ order_id: orderId }).select('*');

const createItem = (data, trx) => {
  const query = trx ? trx(ITEMS_TABLE) : db(ITEMS_TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

const createItems = (dataArray, trx) => {
  const query = trx ? trx(ITEMS_TABLE) : db(ITEMS_TABLE);
  return query.insert(dataArray).returning('*');
};

// Order Status History
const findStatusHistoryByOrderId = (orderId) =>
  db(HISTORY_TABLE).where({ order_id: orderId }).orderBy('created_at', 'asc');

const addStatusHistory = (data, trx) => {
  const query = trx ? trx(HISTORY_TABLE) : db(HISTORY_TABLE);
  return query.insert(data).returning('*').then((rows) => rows[0]);
};

// Order Tracking
const findTrackingByOrderId = (orderId) =>
  db(TRACKING_TABLE).where({ order_id: orderId }).orderBy('updated_at', 'desc').first();

const upsertTracking = async (orderId, data, trx) => {
  const query = trx ? trx(TRACKING_TABLE) : db(TRACKING_TABLE);
  const existing = await (trx ? trx(TRACKING_TABLE) : db(TRACKING_TABLE))
    .where({ order_id: orderId })
    .first();
  if (existing) {
    return query
      .where({ order_id: orderId })
      .update(data)
      .returning('*')
      .then((rows) => rows[0]);
  }
  return query.insert({ order_id: orderId, ...data }).returning('*').then((rows) => rows[0]);
};

const getOrderWithDetails = async (orderId) => {
  const order = await findById(orderId);
  if (!order) return null;
  const items = await findItemsByOrderId(orderId);
  const statusHistory = await findStatusHistoryByOrderId(orderId);
  const tracking = await findTrackingByOrderId(orderId);
  return { ...order, items, statusHistory, tracking };
};

module.exports = {
  findById,
  findByOrderNumber,
  findByUserId,
  findAll,
  create,
  updateById,
  count,
  findItemsByOrderId,
  createItem,
  createItems,
  findStatusHistoryByOrderId,
  addStatusHistory,
  findTrackingByOrderId,
  upsertTracking,
  getOrderWithDetails,
};
