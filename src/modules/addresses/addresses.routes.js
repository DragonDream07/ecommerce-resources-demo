const express = require('express');
const router = express.Router();
const addressesController = require('./addresses.controller');
const { validateAddAddress, validateUpdateAddress } = require('./addresses.validator');
const authenticate = require('../../middlewares/authenticate');

router.use(authenticate);

router.get('/', addressesController.getAddresses);
router.post('/', validateAddAddress, addressesController.addAddress);
router.get('/:addressId', addressesController.getAddressById);
router.put('/:addressId', validateUpdateAddress, addressesController.updateAddress);
router.delete('/:addressId', addressesController.deleteAddress);

module.exports = router;
