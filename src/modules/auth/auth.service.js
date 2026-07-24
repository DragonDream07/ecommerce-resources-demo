const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const RESET_TOKEN_EXPIRES_MINUTES = 60;

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const issueToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const register = async ({ name, email, password }) => {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing && existing.length > 0) {
    throw createError(409, 'An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [name, email, passwordHash, 'user', false]
  );

  const userId = result.insertId;
  const token = issueToken({ id: userId, email, role: 'user' });

  return { token, user: { id: userId, name, email, role: 'user' } };
};

const login = async ({ email, password }) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_guest = false LIMIT 1', [email]);
  const user = rows && rows[0];

  if (!user) {
    throw createError(401, 'Invalid email or password.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw createError(401, 'Invalid email or password.');
  }

  const token = issueToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

const logout = async (token) => {
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await db.query(
          'INSERT INTO token_blacklist (token, expires_at, created_at) VALUES (?, ?, NOW())',
          [token, expiresAt]
        );
      }
    } catch {
      // silently ignore token decode errors on logout
    }
  }
};

const forgotPassword = async ({ email }) => {
  const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND is_guest = false LIMIT 1', [email]);
  const user = rows && rows[0];

  if (!user) {
    // Do not reveal whether email exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  await db.query(
    'DELETE FROM password_reset_tokens WHERE user_id = ?',
    [user.id]
  );

  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())',
    [user.id, tokenHash, expiresAt]
  );

  // Email sending would be triggered here via a mailer service
  // e.g. mailerService.sendPasswordReset({ email, resetToken });
};

const resetPassword = async ({ token, password }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [rows] = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [tokenHash]
  );
  const record = rows && rows[0];

  if (!record) {
    throw createError(400, 'Password reset token is invalid or has expired.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, record.user_id]
  );

  await db.query(
    'DELETE FROM password_reset_tokens WHERE user_id = ?',
    [record.user_id]
  );
};

const guestRegister = async ({ name, email }) => {
  const guestEmail = email || `guest_${crypto.randomBytes(8).toString('hex')}@guest.local`;

  const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [guestEmail]);
  if (existing && existing.length > 0) {
    throw createError(409, 'An account with this email address already exists.');
  }

  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [name || 'Guest', guestEmail, null, 'guest', true]
  );

  const userId = result.insertId;
  const token = issueToken({ id: userId, email: guestEmail, role: 'guest' });

  return { token, user: { id: userId, name: name || 'Guest', email: guestEmail, role: 'guest' } };
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
