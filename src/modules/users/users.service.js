const db = require('../../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const SAFE_USER_FIELDS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'phone',
  'role',
  'is_active',
  'created_at',
  'updated_at',
];

/**
 * Fetches a single user by ID.
 * @param {string|number} userId
 * @returns {object|null}
 */
const getUserById = async (userId) => {
  const result = await db.query(
    `SELECT ${SAFE_USER_FIELDS.join(', ')} FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Fetches a single user by email.
 * @param {string} email
 * @returns {object|null}
 */
const getUserByEmail = async (email) => {
  const result = await db.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Returns a paginated list of users.
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} [options.search]
 * @returns {{ data: object[], total: number, page: number, limit: number }}
 */
const getAllUsers = async ({ page = 1, limit = 20, search } = {}) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = 'WHERE deleted_at IS NULL';

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  const countResult = await db.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit);
  params.push(offset);

  const dataResult = await db.query(
    `SELECT ${SAFE_USER_FIELDS.join(', ')} FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { data: dataResult.rows, total, page, limit };
};

/**
 * Updates allowed fields on a user record.
 * @param {string|number} userId
 * @param {object} payload
 * @returns {object|null}
 */
const updateUser = async (userId, payload) => {
  const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'is_active'];
  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      values.push(payload[field]);
      updates.push(`${field} = $${values.length}`);
    }
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  values.push(new Date());
  updates.push(`updated_at = $${values.length}`);

  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} AND deleted_at IS NULL RETURNING ${SAFE_USER_FIELDS.join(', ')}`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Changes a user's password after verifying the current password.
 * @param {string|number} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await db.query(
    `SELECT id, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  const user = result.rows[0];

  if (!user) {
    const err = new Error('User not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.code = 'INVALID_PASSWORD';
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`,
    [newHash, new Date(), userId]
  );
};

/**
 * Soft-deletes a user by setting deleted_at.
 * @param {string|number} userId
 * @returns {boolean}
 */
const deleteUser = async (userId) => {
  const result = await db.query(
    `UPDATE users SET deleted_at = $1, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
    [new Date(), userId]
  );
  return result.rows.length > 0;
};

module.exports = {
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  changePassword,
  deleteUser,
};
