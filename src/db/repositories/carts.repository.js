const db = require('../knex');

const CARTS_TABLE = 'carts';
const ITEMS_TABLE = 'cart_items';

// Carts
const findById = (id) =>
  db(CARTS_TABLE).where({ id }).first();

const findByUserId = (userId) =>
  db(CARTS_TABLE).where({ user_id: userId }).first();

const findBySessionId = (sessionId) =>
  db(CARTS_TABLE).where({ session_id: sessionId }).first();

const createCart = (data) =>
  db(CARTS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateCartById = (id, data) =>
  db(CARTS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteCartById = (id) =>
  db(CARTS_TABLE).where({ id }).del();

// Cart Items
const findItemsByCartId = (cartId) =>
  db(ITEMS_TABLE).where({ cart_id: cartId }).select('*');

const findItemByCartAndSku = (cartId, skuId) =>
  db(ITEMS_TABLE).where({ cart_id: cartId, sku_id: skuId }).first();

const findItemById = (id) =>
  db(ITEMS_TABLE).where({ id }).first();

const addItem = (data) =>
  db(ITEMS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateItemById = (id, data) =>
  db(ITEMS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteItemById = (id) =>
  db(ITEMS_TABLE).where({ id }).del();

const clearItemsByCartId = (cartId) =>
  db(ITEMS_TABLE).where({ cart_id: cartId }).del();

const getCartWithItems = async (cartId) => {
  const cart = await findById(cartId);
  if (!cart) return null;
  const items = await findItemsByCartId(cartId);
  return { ...cart, items };
};

module.exports = {
  findById,
  findByUserId,
  findBySessionId,
  createCart,
  updateCartById,
  deleteCartById,
  findItemsByCartId,
  findItemByCartAndSku,
  findItemById,
  addItem,
  updateItemById,
  deleteItemById,
  clearItemsByCartId,
  getCartWithItems,
};
