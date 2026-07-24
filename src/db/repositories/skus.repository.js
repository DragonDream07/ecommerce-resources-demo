const db = require('../knex');

const TABLE = 'skus';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySku = (sku) =>
  db(TABLE).where({ sku }).first();

const findByProductId = (productId) =>
  db(TABLE).where({ product_id: productId }).select('*');

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

/**
 * Atomically decrements stock_quantity by `quantity` for the given SKU id.
 * Ensures stock does not go below zero.
 * Returns the number of rows affected (1 on success, 0 if insufficient stock).
 */
const decrementStock = (id, quantity, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query
    .where({ id })
    .where('stock_quantity', '>=', quantity)
    .update({ stock_quantity: db.raw('stock_quantity - ?', [quantity]) });
};

/**
 * Atomically increments stock_quantity by `quantity` for the given SKU id.
 */
const incrementStock = (id, quantity, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query
    .where({ id })
    .update({ stock_quantity: db.raw('stock_quantity + ?', [quantity]) });
};

/**
 * Atomically decrements stock_quantity within a transaction, throwing if insufficient.
 */
const decrementStockOrFail = async (id, quantity, trx) => {
  const affectedRows = await decrementStock(id, quantity, trx);
  if (affectedRows === 0) {
    throw new Error(`Insufficient stock for SKU id=${id}`);
  }
  return affectedRows;
};

const findByIds = (ids) =>
  db(TABLE).whereIn('id', ids).select('*');

module.exports = {
  findById,
  findBySku,
  findByProductId,
  create,
  updateById,
  deleteById,
  decrementStock,
  incrementStock,
  decrementStockOrFail,
  findByIds,
};
