const db = require('../knex');

const TABLE = 'users';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByEmail = (email) =>
  db(TABLE).where({ email }).first();

const findByPhone = (phone) =>
  db(TABLE).where({ phone }).first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const findAll = ({ limit = 20, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const count = () =>
  db(TABLE).count('id as total').first();

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  create,
  updateById,
  deleteById,
  findAll,
  count,
};
