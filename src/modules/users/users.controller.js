const usersService = require('./users.service');
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /users/me
 * Updates the authenticated user's profile.
 */
const updateMe = async (req, res, next) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return validationError;

  try {
    const updated = await usersService.updateUser(req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /users/me/change-password
 * Changes the authenticated user's password.
 */
const changePassword = async (req, res, next) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return validationError;

  try {
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(req.user.id, currentPassword, newPassword);
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    if (err.code === 'INVALID_PASSWORD') {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /users
 * Admin: returns paginated list of all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await usersService.getAllUsers({ page: parseInt(page, 10), limit: parseInt(limit, 10), search });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /users/:userId
 * Admin: returns a specific user by ID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /users/:userId
 * Admin: updates a specific user's details or role.
 */
const updateUser = async (req, res, next) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError !== null) return validationError;

  try {
    const updated = await usersService.updateUser(req.params.userId, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /users/:userId
 * Admin: deletes a specific user.
 */
const deleteUser = async (req, res, next) => {
  try {
    const deleted = await usersService.deleteUser(req.params.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
