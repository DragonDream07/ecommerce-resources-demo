const express = require('express');
const router = express.Router({ mergeParams: true });
const returnsController = require('./returns.controller');
const { validateReturnRequest, validateReview } = require('./returns.validator');
const { authenticate, authorizeAdmin } = require('../../middleware/auth');

// Customer: initiate a return for an order
router.post('/orders/:orderId/return-requests', authenticate, validateReturnRequest, returnsController.createReturnRequest);

// Customer: get a specific return request for an order
router.get('/orders/:orderId/return-requests/:returnRequestId', authenticate, returnsController.getReturnRequestByOrder);

// Admin: list all return requests
router.get('/return-requests', authenticate, authorizeAdmin, returnsController.listReturnRequests);

// Admin: get a specific return request
router.get('/return-requests/:returnRequestId', authenticate, authorizeAdmin, returnsController.getReturnRequest);

// Admin: review (approve/reject) a return request
router.post('/return-requests/:returnRequestId/review', authenticate, authorizeAdmin, validateReview, returnsController.reviewReturnRequest);

module.exports = router;
