const db = require('../knex');

const TABLE = 'promo_codes';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByCode = (code) =>
  db(TABLE).where({ code }).first();

const findActiveByCode = (code) =>
  db(TABLE)
    .where({ code, is_active: true })
    .where('valid_from', '<=', db.fn.now())
    .where(function () {
      this.whereNull('valid_until').orWhere('valid_until', '>=', db.fn.now());
    })
    .first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const incrementUsageCount = (id, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  return query
    .where({ id })
    .update({ usage_count: db.raw('usage_count + 1') });
};

const findAll = ({ limit = 50, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset).orderBy('created_at', 'desc');

module.exports = {
  findById,
  findByCode,
  findActiveByCode,
  create,
  updateById,
  deleteById,
  incrementUsageCount,
  findAll,
};
