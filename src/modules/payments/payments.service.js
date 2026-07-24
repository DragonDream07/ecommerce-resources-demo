const { v4: uuidv4 } = require('uuid');

// In-memory store used until a persistence layer is wired in.
// Replace with a real repository / ORM calls as needed.
const paymentAttempts = new Map();

// ---------------------------------------------------------------------------
// Adapter registry — register provider adapters here.
// Each adapter must expose: { initiate(payload), handleCallback(payload) }
// ---------------------------------------------------------------------------
const adapters = {};

function registerAdapter(providerName, adapter) {
  adapters[providerName] = adapter;
}

function getActiveAdapter(providerName) {
  const name = providerName || process.env.DEFAULT_PAYMENT_PROVIDER || 'mock';
  const adapter = adapters[name];
  if (!adapter) {
    const err = new Error(`Payment provider adapter not found: ${name}`);
    err.status = 400;
    throw err;
  }
  return adapter;
}

// ---------------------------------------------------------------------------
// Default mock adapter (allows the service to run without a real provider)
// ---------------------------------------------------------------------------
registerAdapter('mock', {
  async initiate(payload) {
    return {
      providerReference: `mock-ref-${uuidv4()}`,
      providerStatus: 'PENDING',
      redirectUrl: null,
    };
  },
  async handleCallback(payload) {
    return {
      providerReference: payload.providerReference || payload.reference || null,
      providerStatus: payload.status || 'SUCCESS',
    };
  },
});

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Initiate a new payment attempt.
 * @param {object} payload - Validated request body.
 * @returns {object} Created payment attempt record.
 */
async function initiatePayment(payload) {
  const { amount, currency, provider, orderId, metadata } = payload;

  const adapter = getActiveAdapter(provider);
  const providerResponse = await adapter.initiate({ amount, currency, orderId, metadata });

  const attempt = {
    paymentId: uuidv4(),
    orderId: orderId || null,
    amount,
    currency: currency || 'USD',
    provider: provider || process.env.DEFAULT_PAYMENT_PROVIDER || 'mock',
    status: 'PENDING',
    providerReference: providerResponse.providerReference,
    redirectUrl: providerResponse.redirectUrl || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: 1,
  };

  paymentAttempts.set(attempt.paymentId, attempt);

  return attempt;
}

/**
 * Handle an inbound provider callback / webhook.
 * @param {object} payload - Validated callback body.
 * @returns {object} Updated payment attempt record.
 */
async function handleCallback(payload) {
  const { providerReference, status, paymentId } = payload;

  // Find the matching attempt by paymentId or providerReference
  let attempt = paymentId ? paymentAttempts.get(paymentId) : null;

  if (!attempt && providerReference) {
    for (const record of paymentAttempts.values()) {
      if (record.providerReference === providerReference) {
        attempt = record;
        break;
      }
    }
  }

  if (!attempt) {
    const err = new Error('Payment attempt not found for the provided reference.');
    err.status = 404;
    throw err;
  }

  const adapter = getActiveAdapter(attempt.provider);
  const providerResult = await adapter.handleCallback(payload);

  attempt.status = normaliseStatus(providerResult.providerStatus || status);
  attempt.updatedAt = new Date().toISOString();

  paymentAttempts.set(attempt.paymentId, attempt);

  return attempt;
}

/**
 * Retrieve a payment attempt by its internal ID.
 * @param {string} paymentId
 * @returns {object|null}
 */
async function getPaymentById(paymentId) {
  return paymentAttempts.get(paymentId) || null;
}

/**
 * Retry a failed payment attempt.
 * @param {string} paymentId
 * @param {object} payload - Optional overrides.
 * @returns {object} Updated payment attempt record.
 */
async function retryPayment(paymentId, payload) {
  const attempt = paymentAttempts.get(paymentId);

  if (!attempt) {
    const err = new Error('Payment not found.');
    err.status = 404;
    throw err;
  }

  if (!['FAILED', 'CANCELLED', 'EXPIRED'].includes(attempt.status)) {
    const err = new Error('Only failed, cancelled, or expired payments can be retried.');
    err.status = 400;
    throw err;
  }

  const adapter = getActiveAdapter(attempt.provider);
  const providerResponse = await adapter.initiate({
    amount: attempt.amount,
    currency: attempt.currency,
    orderId: attempt.orderId,
    metadata: attempt.metadata,
    ...payload,
  });

  attempt.status = 'PENDING';
  attempt.providerReference = providerResponse.providerReference;
  attempt.redirectUrl = providerResponse.redirectUrl || null;
  attempt.updatedAt = new Date().toISOString();
  attempt.attempts = (attempt.attempts || 1) + 1;

  paymentAttempts.set(attempt.paymentId, attempt);

  return attempt;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseStatus(rawStatus) {
  if (!rawStatus) return 'UNKNOWN';
  const upper = String(rawStatus).toUpperCase();
  const map = {
    SUCCESS: 'SUCCESS',
    SUCCESSFUL: 'SUCCESS',
    COMPLETED: 'SUCCESS',
    FAILED: 'FAILED',
    FAILURE: 'FAILED',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    PENDING: 'PENDING',
  };
  return map[upper] || upper;
}

module.exports = {
  initiatePayment,
  handleCallback,
  getPaymentById,
  retryPayment,
  registerAdapter,
};
