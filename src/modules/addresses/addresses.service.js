const db = require('../../config/db');

const ADDRESS_NOT_FOUND = 'Address not found.';
const PIN_CODE_NOT_SERVICEABLE = 'Sorry, we do not service this pin code yet.';

async function getAddressesByUserId(userId) {
  const [rows] = await db.query(
    'SELECT * FROM addresses WHERE user_id = ? AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows;
}

async function getAddressById(userId, addressId) {
  const [rows] = await db.query(
    'SELECT * FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );
  if (!rows.length) {
    const err = new Error(ADDRESS_NOT_FOUND);
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
}

async function isPinCodeServiceable(pinCode) {
  const [rows] = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE pin_code = ? AND is_active = 1',
    [pinCode]
  );
  return rows.length > 0;
}

async function clearDefaultAddress(userId) {
  await db.query(
    'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
}

async function addAddress(userId, payload) {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
    address_type,
  } = payload;

  const serviceable = await isPinCodeServiceable(pin_code);
  if (!serviceable) {
    const err = new Error(PIN_CODE_NOT_SERVICEABLE);
    err.statusCode = 422;
    throw err;
  }

  const setDefault = is_default ? 1 : 0;

  if (setDefault) {
    await clearDefaultAddress(userId);
  } else {
    const [existing] = await db.query(
      'SELECT id FROM addresses WHERE user_id = ? AND deleted_at IS NULL',
      [userId]
    );
    if (!existing.length) {
      // First address is automatically default
      setDefault === 0 && (payload.is_default = 1);
    }
  }

  const effectiveDefault = setDefault || !(await _hasAddresses(userId)) ? 1 : 0;

  if (effectiveDefault && !setDefault) {
    // already handled above; do nothing
  }

  const finalDefault = setDefault ? 1 : (await _hasAddresses(userId) ? 0 : 1);

  if (finalDefault) {
    await clearDefaultAddress(userId);
  }

  const [result] = await db.query(
    `INSERT INTO addresses
      (user_id, full_name, phone, address_line1, address_line2, city, state, pin_code, country, is_default, address_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      userId,
      full_name,
      phone,
      address_line1,
      address_line2 || null,
      city,
      state,
      pin_code,
      country || 'India',
      finalDefault,
      address_type || 'home',
    ]
  );

  return getAddressById(userId, result.insertId);
}

async function _hasAddresses(userId) {
  const [rows] = await db.query(
    'SELECT id FROM addresses WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
  return rows.length > 0;
}

async function updateAddress(userId, addressId, payload) {
  const existing = await getAddressById(userId, addressId);

  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
    address_type,
  } = payload;

  const newPinCode = pin_code !== undefined ? pin_code : existing.pin_code;

  if (pin_code && pin_code !== existing.pin_code) {
    const serviceable = await isPinCodeServiceable(pin_code);
    if (!serviceable) {
      const err = new Error(PIN_CODE_NOT_SERVICEABLE);
      err.statusCode = 422;
      throw err;
    }
  }

  const setDefault = is_default !== undefined ? (is_default ? 1 : 0) : existing.is_default;

  if (setDefault) {
    await clearDefaultAddress(userId);
  }

  await db.query(
    `UPDATE addresses SET
      full_name = ?,
      phone = ?,
      address_line1 = ?,
      address_line2 = ?,
      city = ?,
      state = ?,
      pin_code = ?,
      country = ?,
      is_default = ?,
      address_type = ?,
      updated_at = NOW()
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [
      full_name !== undefined ? full_name : existing.full_name,
      phone !== undefined ? phone : existing.phone,
      address_line1 !== undefined ? address_line1 : existing.address_line1,
      address_line2 !== undefined ? address_line2 : existing.address_line2,
      city !== undefined ? city : existing.city,
      state !== undefined ? state : existing.state,
      newPinCode,
      country !== undefined ? country : existing.country,
      setDefault,
      address_type !== undefined ? address_type : existing.address_type,
      addressId,
      userId,
    ]
  );

  return getAddressById(userId, addressId);
}

async function deleteAddress(userId, addressId) {
  const existing = await getAddressById(userId, addressId);

  await db.query(
    'UPDATE addresses SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );

  // If deleted address was default, set the most recent remaining as default
  if (existing.is_default) {
    const [remaining] = await db.query(
      'SELECT id FROM addresses WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (remaining.length) {
      await db.query(
        'UPDATE addresses SET is_default = 1 WHERE id = ?',
        [remaining[0].id]
      );
    }
  }
}

module.exports = {
  getAddressesByUserId,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
};
