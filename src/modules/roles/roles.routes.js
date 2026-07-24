const express = require('express');
const router = express.Router();
const rolesController = require('./roles.controller');

// Role CRUD
router.get('/', rolesController.getAllRoles);
router.get('/:id', rolesController.getRoleById);
router.post('/', rolesController.createRole);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);

// User-Role assignment
router.get('/:id/users', rolesController.getUsersByRole);
router.post('/assign', rolesController.assignRoleToUser);
router.delete('/assign', rolesController.removeRoleFromUser);
router.get('/user/:userId', rolesController.getRolesByUser);

module.exports = router;
