const addressesService = require('./addresses.service');

async function getAddresses(req, res, next) {
  try {
    const userId = req.user.id;
    const addresses = await addressesService.getAddressesByUserId(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

async function getAddressById(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressesService.getAddressById(userId, addressId);
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function addAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const payload = req.body;
    const address = await addressesService.addAddress(userId, payload);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const payload = req.body;
    const address = await addressesService.updateAddress(userId, addressId, payload);
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    await addressesService.deleteAddress(userId, addressId);
    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAddresses,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
};
