'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');

// Apply authentication and admin RBAC middleware to all admin routes
router.use(requireAuth);
router.use(requireRole('admin'));

// Reports
router.get('/reports', adminController.getReports);

// Permissions
router.get('/permissions', adminController.getPermissions);

// Roles
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.get('/roles/:roleId', adminController.getRoleById);
router.put('/roles/:roleId', adminController.updateRole);
router.delete('/roles/:roleId', adminController.deleteRole);

// Role Permissions
router.get('/roles/:roleId/permissions', adminController.getRolePermissions);
router.post('/roles/:roleId/permissions', adminController.addPermissionToRole);
router.delete('/roles/:roleId/permissions/:permissionId', adminController.removePermissionFromRole);

// Serviceable Pin Codes
router.get('/serviceable-pin-codes', adminController.getServiceablePinCodes);
router.post('/serviceable-pin-codes', adminController.createServiceablePinCode);
router.put('/serviceable-pin-codes/:pinCodeId', adminController.updateServiceablePinCode);
router.delete('/serviceable-pin-codes/:pinCodeId', adminController.deleteServiceablePinCode);

module.exports = router;
