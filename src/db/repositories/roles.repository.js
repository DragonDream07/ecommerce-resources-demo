const db = require('../knex');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';

// Roles
const findRoleById = (id) =>
  db(ROLES_TABLE).where({ id }).first();

const findRoleByName = (name) =>
  db(ROLES_TABLE).where({ name }).first();

const getAllRoles = () =>
  db(ROLES_TABLE).select('*');

const createRole = (data) =>
  db(ROLES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateRole = (id, data) =>
  db(ROLES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteRole = (id) =>
  db(ROLES_TABLE).where({ id }).del();

// User Roles
const assignRoleToUser = (userId, roleId) =>
  db(USER_ROLES_TABLE).insert({ user_id: userId, role_id: roleId }).returning('*').then((rows) => rows[0]);

const removeRoleFromUser = (userId, roleId) =>
  db(USER_ROLES_TABLE).where({ user_id: userId, role_id: roleId }).del();

const getRolesForUser = (userId) =>
  db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, `${USER_ROLES_TABLE}.role_id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .select(`${ROLES_TABLE}.*`);

const getUsersForRole = (roleId) =>
  db(USER_ROLES_TABLE)
    .join('users', 'users.id', `${USER_ROLES_TABLE}.user_id`)
    .where(`${USER_ROLES_TABLE}.role_id`, roleId)
    .select('users.*');

const userHasRole = (userId, roleName) =>
  db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, `${USER_ROLES_TABLE}.role_id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .where(`${ROLES_TABLE}.name`, roleName)
    .first();

module.exports = {
  findRoleById,
  findRoleByName,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesForUser,
  getUsersForRole,
  userHasRole,
};
