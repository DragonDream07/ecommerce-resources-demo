const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth');
const {
  validateUpdateMe,
  validateChangePassword,
  validateAdminUpdateUser,
} = require('./users.validator');

// Current user routes
router.get('/me', authenticate, usersController.getMe);
router.patch('/me', authenticate, validateUpdateMe, usersController.updateMe);
router.post('/me/change-password', authenticate, validateChangePassword, usersController.changePassword);

// Admin user management routes
router.get('/', authenticate, authorizeAdmin, usersController.getAllUsers);
router.get('/:userId', authenticate, authorizeAdmin, usersController.getUserById);
router.patch('/:userId', authenticate, authorizeAdmin, validateAdminUpdateUser, usersController.updateUser);
router.delete('/:userId', authenticate, authorizeAdmin, usersController.deleteUser);

module.exports = router;
