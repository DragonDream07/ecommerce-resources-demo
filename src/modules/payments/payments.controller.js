const paymentsService = require('./payments.service');

/**
 * POST /payments/initiate
 */
async function initiatePayment(req, res, next) {
  try {
    const result = await paymentsService.initiatePayment(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/callback  (also serves /payments/webhook)
 */
async function handleCallback(req, res, next) {
  try {
    const result = await paymentsService.handleCallback(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:paymentId
 */
async function getPayment(req, res, next) {
  try {
    const payment = await paymentsService.getPaymentById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    return res.status(200).json(payment);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:paymentId/retry
 */
async function retryPayment(req, res, next) {
  try {
    const result = await paymentsService.retryPayment(req.params.paymentId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiatePayment,
  handleCallback,
  getPayment,
  retryPayment,
};
