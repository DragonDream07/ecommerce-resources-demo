'use strict';

const db = require('../../db');

// ---------------------------------------------------------------------------
// Reports (cross-domain read aggregation)
// ---------------------------------------------------------------------------

/**
 * Aggregates cross-domain data for admin reports.
 * @param {object} filters - Optional filters: from, to, type
 * @returns {Promise<object>}
 */
async function getReports(filters) {
  const { from, to, type } = filters || {};

  const dateFilter = buildDateFilter(from, to);

  const [ordersResult, usersResult, revenueResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total_orders
       FROM orders
       WHERE 1=1 ${dateFilter.clause}`,
      dateFilter.params
    ),
    db.query(
      `SELECT COUNT(*) AS total_users
       FROM users
       WHERE 1=1 ${dateFilter.clause}`,
      dateFilter.params
    ),
    db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM orders
       WHERE status NOT IN ('cancelled', 'failed') ${dateFilter.clause}`,
      dateFilter.params
    ),
  ]);

  return {
    total_orders: parseInt(ordersResult.rows[0].total_orders, 10),
    total_users: parseInt(usersResult.rows[0].total_users, 10),
    total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
    filters: { from: from || null, to: to || null, type: type || null },
  };
}

/**
 * Builds a parameterised date range clause.
 * @param {string|undefined} from
 * @param {string|undefined} to
 * @returns {{ clause: string, params: any[] }}
 */
function buildDateFilter(from, to) {
  const params = [];
  let clause = '';

  if (from) {
    params.push(from);
    clause += ` AND created_at >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    clause += ` AND created_at <= $${params.length}`;
  }

  return { clause, params };
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

async function getAllPermissions() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM permissions ORDER BY name ASC'
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

async function getAllRoles() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC'
  );
  return result.rows;
}

async function createRole(data) {
  const { name, description } = data;
  const result = await db.query(
    `INSERT INTO roles (name, description, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id, name, description, created_at, updated_at`,
    [name, description || null]
  );
  return result.rows[0];
}

async function getRoleById(roleId) {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1',
    [roleId]
  );
  if (!result.rows.length) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

async function updateRole(roleId, data) {
  const { name, description } = data;
  const result = await db.query(
    `UPDATE roles
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, description, created_at, updated_at`,
    [name || null, description !== undefined ? description : null, roleId]
  );
  if (!result.rows.length) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

async function deleteRole(roleId) {
  const result = await db.query(
    'DELETE FROM roles WHERE id = $1 RETURNING id',
    [roleId]
  );
  if (!result.rows.length) {
    const err = new Error('Role not found.');
    err.statusCode = 404;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Role Permissions
// ---------------------------------------------------------------------------

async function getRolePermissions(roleId) {
  await getRoleById(roleId);
  const result = await db.query(
    `SELECT p.id, p.name, p.description, rp.created_at AS assigned_at
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.name ASC`,
    [roleId]
  );
  return result.rows;
}

async function addPermissionToRole(roleId, data) {
  await getRoleById(roleId);
  const { permission_id } = data;

  const exists = await db.query(
    'SELECT id FROM permissions WHERE id = $1',
    [permission_id]
  );
  if (!exists.rows.length) {
    const err = new Error('Permission not found.');
    err.statusCode = 404;
    throw err;
  }

  const duplicate = await db.query(
    'SELECT role_id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
    [roleId, permission_id]
  );
  if (duplicate.rows.length) {
    const err = new Error('Permission is already assigned to this role.');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    `INSERT INTO role_permissions (role_id, permission_id, created_at)
     VALUES ($1, $2, NOW())
     RETURNING role_id, permission_id, created_at`,
    [roleId, permission_id]
  );
  return result.rows[0];
}

async function removePermissionFromRole(roleId, permissionId) {
  await getRoleById(roleId);
  const result = await db.query(
    'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING role_id',
    [roleId, permissionId]
  );
  if (!result.rows.length) {
    const err = new Error('Permission assignment not found.');
    err.statusCode = 404;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Serviceable Pin Codes
// ---------------------------------------------------------------------------

async function getAllServiceablePinCodes() {
  const result = await db.query(
    `SELECT id, pin_code, city, state, is_active, created_at, updated_at
     FROM serviceable_pin_codes
     ORDER BY pin_code ASC`
  );
  return result.rows;
}

async function createServiceablePinCode(data) {
  const { pin_code, city, state, is_active } = data;
  const result = await db.query(
    `INSERT INTO serviceable_pin_codes (pin_code, city, state, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [pin_code, city || null, state || null, is_active !== undefined ? is_active : true]
  );
  return result.rows[0];
}

async function updateServiceablePinCode(pinCodeId, data) {
  const { pin_code, city, state, is_active } = data;
  const result = await db.query(
    `UPDATE serviceable_pin_codes
     SET pin_code  = COALESCE($1, pin_code),
         city      = COALESCE($2, city),
         state     = COALESCE($3, state),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [
      pin_code !== undefined ? pin_code : null,
      city !== undefined ? city : null,
      state !== undefined ? state : null,
      is_active !== undefined ? is_active : null,
      pinCodeId,
    ]
  );
  if (!result.rows.length) {
    const err = new Error('Serviceable pin code not found.');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

async function deleteServiceablePinCode(pinCodeId) {
  const result = await db.query(
    'DELETE FROM serviceable_pin_codes WHERE id = $1 RETURNING id',
    [pinCodeId]
  );
  if (!result.rows.length) {
    const err = new Error('Serviceable pin code not found.');
    err.statusCode = 404;
    throw err;
  }
}

module.exports = {
  getReports,
  getAllPermissions,
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAllServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
