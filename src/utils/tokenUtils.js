const crypto = require('crypto');

const TOKEN_BYTE_LENGTH = 32;

/**
 * Generate a cryptographically secure random reset token.
 *
 * Returns both the raw token (to be sent to the user) and its SHA-256 hash
 * (to be stored in the database so the plaintext is never persisted).
 *
 * @returns {{ token: string, tokenHash: string }}
 */
const generateResetToken = () => {
  const token = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
};

/**
 * Hash a plaintext token using SHA-256.
 *
 * @param {string} token - Plaintext hex token
 * @returns {string} Hex-encoded SHA-256 digest
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify that a plaintext token matches the stored hash.
 *
 * @param {string} token     - Plaintext token supplied by the user
 * @param {string} tokenHash - SHA-256 hash stored in the database
 * @returns {boolean}
 */
const verifyResetToken = (token, tokenHash) => {
  const candidateHash = hashToken(token);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(tokenHash, 'hex')
  );
};

module.exports = { generateResetToken, hashToken, verifyResetToken };
