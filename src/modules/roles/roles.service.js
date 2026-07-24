// In-memory store used as a fallback when no database layer is injected.
// Replace with actual repository calls once a DB layer is wired up.

const roles = new Map();
const userRoles = []; // [{ userId, roleId }]
let nextId = 1;

/**
 * Retrieve all roles.
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  return Array.from(roles.values());
}

/**
 * Retrieve a single role by its id.
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
async function getRoleById(id) {
  return roles.get(String(id)) || null;
}

/**
 * Create a new role.
 * @param {{ name: string, description?: string, permissions?: string[] }} data
 * @returns {Promise<Object>}
 */
async function createRole({ name, description = '', permissions = [] }) {
  const id = String(nextId++);
  const existing = Array.from(roles.values()).find((r) => r.name === name);
  if (existing) {
    const err = new Error('A role with this name already exists');
    err.statusCode = 409;
    throw err;
  }
  const role = { id, name, description, permissions, createdAt: new Date().toISOString() };
  roles.set(id, role);
  return role;
}

/**
 * Update an existing role.
 * @param {string|number} id
 * @param {{ name?: string, description?: string, permissions?: string[] }} data
 * @returns {Promise<Object|null>}
 */
async function updateRole(id, { name, description, permissions }) {
  const role = roles.get(String(id));
  if (!role) return null;

  if (name !== undefined) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissions !== undefined) role.permissions = permissions;
  role.updatedAt = new Date().toISOString();

  roles.set(String(id), role);
  return role;
}

/**
 * Delete a role by id.
 * @param {string|number} id
 * @returns {Promise<boolean>}
 */
async function deleteRole(id) {
  const key = String(id);
  if (!roles.has(key)) return false;
  roles.delete(key);
  // Also remove any user-role associations for this role.
  const idx = userRoles.reduce((acc, ur, i) => {
    if (String(ur.roleId) === key) acc.push(i);
    return acc;
  }, []);
  idx.reverse().forEach((i) => userRoles.splice(i, 1));
  return true;
}

/**
 * Get all users assigned to a role.
 * @param {string|number} roleId
 * @returns {Promise<Array<{ userId: string }>>}
 */
async function getUsersByRole(roleId) {
  return userRoles
    .filter((ur) => String(ur.roleId) === String(roleId))
    .map((ur) => ({ userId: ur.userId }));
}

/**
 * Assign a role to a user.
 * @param {{ userId: string|number, roleId: string|number }} param0
 * @returns {Promise<Object>}
 */
async function assignRoleToUser({ userId, roleId }) {
  const roleExists = roles.has(String(roleId));
  if (!roleExists) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }
  const alreadyAssigned = userRoles.some(
    (ur) => String(ur.userId) === String(userId) && String(ur.roleId) === String(roleId)
  );
  if (alreadyAssigned) {
    const err = new Error('User already has this role');
    err.statusCode = 409;
    throw err;
  }
  const assignment = { userId: String(userId), roleId: String(roleId), assignedAt: new Date().toISOString() };
  userRoles.push(assignment);
  return assignment;
}

/**
 * Remove a role from a user.
 * @param {{ userId: string|number, roleId: string|number }} param0
 * @returns {Promise<boolean>}
 */
async function removeRoleFromUser({ userId, roleId }) {
  const index = userRoles.findIndex(
    (ur) => String(ur.userId) === String(userId) && String(ur.roleId) === String(roleId)
  );
  if (index === -1) return false;
  userRoles.splice(index, 1);
  return true;
}

/**
 * Get all roles assigned to a user.
 * @param {string|number} userId
 * @returns {Promise<Array<Object>>}
 */
async function getRolesByUser(userId) {
  return userRoles
    .filter((ur) => String(ur.userId) === String(userId))
    .map((ur) => roles.get(String(ur.roleId)))
    .filter(Boolean);
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesByUser,
};
