const db = require('../knex');

const TABLE = 'addresses';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUserId = (userId) =>
  db(TABLE).where({ user_id: userId }).select('*');

const findDefaultByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_default: true }).first();

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const clearDefaultForUser = (userId) =>
  db(TABLE).where({ user_id: userId }).update({ is_default: false });

const setDefaultForUser = async (userId, addressId, trx) => {
  const query = trx ? trx(TABLE) : db(TABLE);
  await query.where({ user_id: userId }).update({ is_default: false });
  return (trx ? trx(TABLE) : db(TABLE))
    .where({ id: addressId, user_id: userId })
    .update({ is_default: true })
    .returning('*')
    .then((rows) => rows[0]);
};

module.exports = {
  findById,
  findByUserId,
  findDefaultByUserId,
  create,
  updateById,
  deleteById,
  clearDefaultForUser,
  setDefaultForUser,
};
