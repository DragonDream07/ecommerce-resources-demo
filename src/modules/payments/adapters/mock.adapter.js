'use strict';

const PaymentAdapterInterface = require('./payment.adapter.interface');

/**
 * MockAdapter
 *
 * Test-mode payment adapter.  All methods return configurable success or
 * failure responses without contacting any external service.
 *
 * Usage:
 *   const adapter = new MockAdapter();                          // always succeeds
 *   const adapter = new MockAdapter({ shouldFail: true });      // always fails
 *   const adapter = new MockAdapter({ shouldFail: false, delay: 50 }); // 50 ms artificial latency
 *
 * Individual methods can be overridden at runtime via the `overrides` map:
 *   adapter.overrides.createPayment = async () => ({ ... });
 */
class MockAdapter extends PaymentAdapterInterface {
  /**
   * @param {Object}  [config]
   * @param {boolean} [config.shouldFail=false]       - When true every operation rejects with a MockPaymentError.
   * @param {number}  [config.delay=0]                - Artificial async delay in milliseconds.
   * @param {string}  [config.errorCode='MOCK_ERROR'] - Error code injected into failure responses.
   * @param {string}  [config.errorMessage='Mock payment failure'] - Error message for failures.
   */
  constructor(config = {}) {
    super();

    this._shouldFail = config.shouldFail === true;
    this._delay = typeof config.delay === 'number' ? config.delay : 0;
    this._errorCode = config.errorCode || 'MOCK_ERROR';
    this._errorMessage = config.errorMessage || 'Mock payment failure';

    /** Counters – useful for assertions in tests. */
    this.callCounts = {
      createPayment: 0,
      capturePayment: 0,
      voidPayment: 0,
      refundPayment: 0,
      getPaymentStatus: 0,
      parseWebhookEvent: 0,
    };

    /** Per-method override hooks. Set to an async function to take full control. */
    this.overrides = {};
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _wait() {
    if (this._delay <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this._delay));
  }

  _fail() {
    const err = new Error(this._errorMessage);
    err.code = this._errorCode;
    err.isMockError = true;
    return Promise.reject(err);
  }

  _mockPaymentId() {
    return 'mock_pay_' + Math.random().toString(36).slice(2, 11);
  }

  _mockRefundId() {
    return 'mock_ref_' + Math.random().toString(36).slice(2, 11);
  }

  // ---------------------------------------------------------------------------
  // Interface implementation
  // ---------------------------------------------------------------------------

  /**
   * @param {Object} params
   * @returns {Promise<import('./payment.adapter.interface').PaymentResult>}
   */
  async createPayment(params) {
    this.callCounts.createPayment += 1;
    if (this.overrides.createPayment) return this.overrides.createPayment(params);
    await this._wait();
    if (this._shouldFail) return this._fail();

    return {
      id: this._mockPaymentId(),
      status: 'authorised',
      amount: params.amount,
      currency: params.currency,
      raw: { mock: true, input: params },
    };
  }

  /**
   * @param {string} paymentId
   * @param {Object} [options]
   * @returns {Promise<import('./payment.adapter.interface').PaymentResult>}
   */
  async capturePayment(paymentId, options = {}) {
    this.callCounts.capturePayment += 1;
    if (this.overrides.capturePayment) return this.overrides.capturePayment(paymentId, options);
    await this._wait();
    if (this._shouldFail) return this._fail();

    return {
      id: paymentId,
      status: 'captured',
      amount: options.amount !== undefined ? options.amount : 0,
      currency: options.currency || 'USD',
      raw: { mock: true, paymentId, options },
    };
  }

  /**
   * @param {string} paymentId
   * @returns {Promise<import('./payment.adapter.interface').PaymentResult>}
   */
  async voidPayment(paymentId) {
    this.callCounts.voidPayment += 1;
    if (this.overrides.voidPayment) return this.overrides.voidPayment(paymentId);
    await this._wait();
    if (this._shouldFail) return this._fail();

    return {
      id: paymentId,
      status: 'voided',
      amount: 0,
      currency: 'USD',
      raw: { mock: true, paymentId },
    };
  }

  /**
   * @param {string} paymentId
   * @param {Object} [options]
   * @returns {Promise<import('./payment.adapter.interface').RefundResult>}
   */
  async refundPayment(paymentId, options = {}) {
    this.callCounts.refundPayment += 1;
    if (this.overrides.refundPayment) return this.overrides.refundPayment(paymentId, options);
    await this._wait();
    if (this._shouldFail) return this._fail();

    return {
      id: this._mockRefundId(),
      paymentId,
      status: 'succeeded',
      amount: options.amount !== undefined ? options.amount : 0,
      currency: options.currency || 'USD',
      raw: { mock: true, paymentId, options },
    };
  }

  /**
   * @param {string} paymentId
   * @returns {Promise<import('./payment.adapter.interface').PaymentResult>}
   */
  async getPaymentStatus(paymentId) {
    this.callCounts.getPaymentStatus += 1;
    if (this.overrides.getPaymentStatus) return this.overrides.getPaymentStatus(paymentId);
    await this._wait();
    if (this._shouldFail) return this._fail();

    return {
      id: paymentId,
      status: 'captured',
      amount: 0,
      currency: 'USD',
      raw: { mock: true, paymentId },
    };
  }

  /**
   * @param {Object} params
   * @param {string|Buffer} params.rawBody
   * @param {Object}        params.headers
   * @param {string}        params.secret
   * @returns {Promise<import('./payment.adapter.interface').WebhookEvent>}
   */
  async parseWebhookEvent(params) {
    this.callCounts.parseWebhookEvent += 1;
    if (this.overrides.parseWebhookEvent) return this.overrides.parseWebhookEvent(params);
    await this._wait();
    if (this._shouldFail) return this._fail();

    let parsed = {};
    try {
      parsed = typeof params.rawBody === 'string'
        ? JSON.parse(params.rawBody)
        : params.rawBody;
    } catch (_) {
      // rawBody may not be JSON in some tests; treat as empty object
    }

    return {
      eventType: parsed.eventType || 'mock.payment.captured',
      paymentId: parsed.paymentId || 'mock_pay_unknown',
      status: parsed.status || 'captured',
      raw: { mock: true, parsed },
    };
  }

  // ---------------------------------------------------------------------------
  // Test helpers
  // ---------------------------------------------------------------------------

  /**
   * Configure the adapter to succeed on the next N calls then fail afterwards.
   * This replaces the simple `shouldFail` flag with a call-count-based gate.
   *
   * @param {number} successCount - How many calls succeed before failures begin.
   */
  failAfter(successCount) {
    let remaining = successCount;
    const original = this._shouldFail;
    this._shouldFail = false;

    const gate = () => {
      if (remaining > 0) {
        remaining -= 1;
        return false; // succeed
      }
      return true; // fail
    };

    // Wrap every method to honour the gate
    const methods = ['createPayment', 'capturePayment', 'voidPayment', 'refundPayment', 'getPaymentStatus', 'parseWebhookEvent'];
    methods.forEach((method) => {
      const originalMethod = this[method].bind(this);
      this[method] = async (...args) => {
        const prevFail = this._shouldFail;
        this._shouldFail = gate();
        try {
          return await originalMethod(...args);
        } finally {
          this._shouldFail = prevFail;
        }
      };
    });

    // Restore original flag once done (best-effort; gates are already closed)
    void original;
  }

  /**
   * Reset all call counters back to zero.
   */
  resetCounters() {
    Object.keys(this.callCounts).forEach((k) => {
      this.callCounts[k] = 0;
    });
  }
}

module.exports = MockAdapter;
