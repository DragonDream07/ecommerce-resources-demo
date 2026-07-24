const db = require('../knex');

const TABLE = 'serviceable_pin_codes';

const findByPinCode = (pinCode) =>
  db(TABLE).where({ pin_code: pinCode }).first();

const isServiceable = async (pinCode) => {
  const record = await db(TABLE).where({ pin_code: pinCode, is_active: true }).first();
  return Boolean(record);
};

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateByPinCode = (pinCode, data) =>
  db(TABLE).where({ pin_code: pinCode }).update(data).returning('*').then((rows) => rows[0]);

const deleteByPinCode = (pinCode) =>
  db(TABLE).where({ pin_code: pinCode }).del();

const findAll = ({ limit = 100, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const findAllActive = () =>
  db(TABLE).where({ is_active: true }).select('*');

module.exports = {
  findByPinCode,
  isServiceable,
  create,
  updateByPinCode,
  deleteByPinCode,
  findAll,
  findAllActive,
};
