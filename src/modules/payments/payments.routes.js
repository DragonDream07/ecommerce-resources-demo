const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { validateInitiatePayment, validateCallback, validateRetry } = require('./payments.validator');

// POST /payments/initiate
router.post('/initiate', validateInitiatePayment, paymentsController.initiatePayment);

// POST /payments/callback (webhook / provider callback)
router.post('/callback', validateCallback, paymentsController.handleCallback);

// POST /payments/webhook (alias kept for design-package compatibility)
router.post('/webhook', validateCallback, paymentsController.handleCallback);

// GET /payments/:paymentId
router.get('/:paymentId', paymentsController.getPayment);

// POST /payments/:paymentId/retry
router.post('/:paymentId/retry', validateRetry, paymentsController.retryPayment);

module.exports = router;
