const db = require('../knex');

const TABLE = 'notifications';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(TABLE)
    .where({ user_id: userId })
    .limit(limit)
    .offset(offset)
    .orderBy('created_at', 'desc');

const findUnreadByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_read: false }).orderBy('created_at', 'desc');

const countUnreadByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_read: false }).count('id as total').first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const createMany = (dataArray) =>
  db(TABLE).insert(dataArray).returning('*');

const markAsRead = (id) =>
  db(TABLE).where({ id }).update({ is_read: true, read_at: db.fn.now() }).returning('*').then((rows) => rows[0]);

const markAllAsReadForUser = (userId) =>
  db(TABLE)
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true, read_at: db.fn.now() });

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const deleteAllForUser = (userId) =>
  db(TABLE).where({ user_id: userId }).del();

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

module.exports = {
  findById,
  findByUserId,
  findUnreadByUserId,
  countUnreadByUserId,
  create,
  createMany,
  markAsRead,
  markAllAsReadForUser,
  deleteById,
  deleteAllForUser,
  updateById,
};
