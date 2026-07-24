const db = require('../knex');

const TABLE = 'brands';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findAll = ({ limit = 50, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset).orderBy('name', 'asc');

const findAllActive = () =>
  db(TABLE).where({ is_active: true }).orderBy('name', 'asc');

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const count = () =>
  db(TABLE).count('id as total').first();

module.exports = {
  findById,
  findBySlug,
  findAll,
  findAllActive,
  create,
  updateById,
  deleteById,
  count,
};
