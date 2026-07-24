const { body } = require('express-validator');

/**
 * Validation schema for PATCH /users/me
 */
const validateUpdateMe = [
  body('first_name')
    .optional()
    .isString()
    .withMessage('First name must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters.'),

  body('last_name')
    .optional()
    .isString()
    .withMessage('Last name must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters.'),

  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string.')
    .trim()
    .matches(/^[+]?[0-9\s\-().]{7,20}$/)
    .withMessage('Phone number is invalid.'),
];

/**
 * Validation schema for POST /users/me/change-password
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.')
    .isString()
    .withMessage('Current password must be a string.'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isString()
    .withMessage('New password must be a string.')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter.')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number.'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

/**
 * Validation schema for PATCH /users/:userId (admin)
 */
const validateAdminUpdateUser = [
  body('first_name')
    .optional()
    .isString()
    .withMessage('First name must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters.'),

  body('last_name')
    .optional()
    .isString()
    .withMessage('Last name must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters.'),

  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string.')
    .trim()
    .matches(/^[+]?[0-9\s\-().]{7,20}$/)
    .withMessage('Phone number is invalid.'),

  body('role')
    .optional()
    .isString()
    .withMessage('Role must be a string.')
    .isIn(['user', 'admin'])
    .withMessage('Role must be one of: user, admin.'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value.'),
];

module.exports = {
  validateUpdateMe,
  validateChangePassword,
  validateAdminUpdateUser,
};
