'use strict';

const adminService = require('./admin.service');

/**
 * GET /admin/reports
 * Orchestrates cross-domain report aggregation
 */
async function getReports(req, res, next) {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      type: req.query.type,
    };
    const reports = await adminService.getReports(filters);
    return res.status(200).json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/permissions
 */
async function getPermissions(req, res, next) {
  try {
    const permissions = await adminService.getAllPermissions();
    return res.status(200).json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/roles
 */
async function getRoles(req, res, next) {
  try {
    const roles = await adminService.getAllRoles();
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/roles
 */
async function createRole(req, res, next) {
  try {
    const role = await adminService.createRole(req.body);
    return res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/roles/:roleId
 */
async function getRoleById(req, res, next) {
  try {
    const role = await adminService.getRoleById(req.params.roleId);
    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/roles/:roleId
 */
async function updateRole(req, res, next) {
  try {
    const role = await adminService.updateRole(req.params.roleId, req.body);
    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/roles/:roleId
 */
async function deleteRole(req, res, next) {
  try {
    await adminService.deleteRole(req.params.roleId);
    return res.status(200).json({ success: true, message: 'Role deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/roles/:roleId/permissions
 */
async function getRolePermissions(req, res, next) {
  try {
    const permissions = await adminService.getRolePermissions(req.params.roleId);
    return res.status(200).json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/roles/:roleId/permissions
 */
async function addPermissionToRole(req, res, next) {
  try {
    const result = await adminService.addPermissionToRole(req.params.roleId, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 */
async function removePermissionFromRole(req, res, next) {
  try {
    await adminService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    return res.status(200).json({ success: true, message: 'Permission removed from role successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/serviceable-pin-codes
 */
async function getServiceablePinCodes(req, res, next) {
  try {
    const pinCodes = await adminService.getAllServiceablePinCodes();
    return res.status(200).json({ success: true, data: pinCodes });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/serviceable-pin-codes
 */
async function createServiceablePinCode(req, res, next) {
  try {
    const pinCode = await adminService.createServiceablePinCode(req.body);
    return res.status(201).json({ success: true, data: pinCode });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/serviceable-pin-codes/:pinCodeId
 */
async function updateServiceablePinCode(req, res, next) {
  try {
    const pinCode = await adminService.updateServiceablePinCode(req.params.pinCodeId, req.body);
    return res.status(200).json({ success: true, data: pinCode });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/serviceable-pin-codes/:pinCodeId
 */
async function deleteServiceablePinCode(req, res, next) {
  try {
    await adminService.deleteServiceablePinCode(req.params.pinCodeId);
    return res.status(200).json({ success: true, message: 'Serviceable pin code deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReports,
  getPermissions,
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
