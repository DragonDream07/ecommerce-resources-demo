/**
 * PaymentAdapterInterface
 *
 * Duck-type contract that every payment provider adapter must satisfy.
 * Concrete adapters must implement all methods defined here.
 * Calling any method on the base class directly will throw an error.
 */
class PaymentAdapterInterface {
  /**
   * Initialise a new payment / charge.
   *
   * @param {Object} params
   * @param {string} params.orderId        - Internal order identifier.
   * @param {number} params.amount         - Amount in the smallest currency unit (e.g. cents).
   * @param {string} params.currency       - ISO 4217 currency code (e.g. "USD").
   * @param {Object} params.paymentMethod  - Provider-specific payment method descriptor.
   * @param {Object} [params.metadata]     - Arbitrary key/value pairs forwarded to the provider.
   * @returns {Promise<PaymentResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async createPayment(params) {
    throw new Error('PaymentAdapterInterface.createPayment() must be implemented by a concrete adapter.');
  }

  /**
   * Capture a previously authorised payment.
   *
   * @param {string} paymentId  - Provider-issued payment / charge identifier.
   * @param {Object} [options]
   * @param {number} [options.amount]  - Partial capture amount (smallest currency unit). Omit to capture in full.
   * @returns {Promise<PaymentResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async capturePayment(paymentId, options = {}) {
    throw new Error('PaymentAdapterInterface.capturePayment() must be implemented by a concrete adapter.');
  }

  /**
   * Void / cancel an authorised (but not yet captured) payment.
   *
   * @param {string} paymentId  - Provider-issued payment / charge identifier.
   * @returns {Promise<PaymentResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async voidPayment(paymentId) {
    throw new Error('PaymentAdapterInterface.voidPayment() must be implemented by a concrete adapter.');
  }

  /**
   * Refund a captured payment (fully or partially).
   *
   * @param {string} paymentId  - Provider-issued payment / charge identifier.
   * @param {Object} [options]
   * @param {number} [options.amount]  - Partial refund amount (smallest currency unit). Omit to refund in full.
   * @param {string} [options.reason]  - Human-readable refund reason.
   * @returns {Promise<RefundResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async refundPayment(paymentId, options = {}) {
    throw new Error('PaymentAdapterInterface.refundPayment() must be implemented by a concrete adapter.');
  }

  /**
   * Retrieve the current status of a payment.
   *
   * @param {string} paymentId  - Provider-issued payment / charge identifier.
   * @returns {Promise<PaymentResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async getPaymentStatus(paymentId) {
    throw new Error('PaymentAdapterInterface.getPaymentStatus() must be implemented by a concrete adapter.');
  }

  /**
   * Verify and parse an inbound webhook payload from the provider.
   *
   * @param {Object} params
   * @param {string|Buffer} params.rawBody   - Raw request body (before JSON parsing).
   * @param {Object}        params.headers   - HTTP request headers.
   * @param {string}        params.secret    - Shared webhook signing secret.
   * @returns {Promise<WebhookEvent>}
   */
  // eslint-disable-next-line no-unused-vars
  async parseWebhookEvent(params) {
    throw new Error('PaymentAdapterInterface.parseWebhookEvent() must be implemented by a concrete adapter.');
  }
}

/**
 * @typedef {Object} PaymentResult
 * @property {string}  id          - Provider-issued payment identifier.
 * @property {string}  status      - One of: 'pending' | 'authorised' | 'captured' | 'voided' | 'failed'.
 * @property {number}  amount      - Amount in the smallest currency unit.
 * @property {string}  currency    - ISO 4217 currency code.
 * @property {Object}  [raw]       - Full raw response from the provider (optional).
 */

/**
 * @typedef {Object} RefundResult
 * @property {string}  id          - Provider-issued refund identifier.
 * @property {string}  paymentId   - Associated provider payment identifier.
 * @property {string}  status      - One of: 'pending' | 'succeeded' | 'failed'.
 * @property {number}  amount      - Refunded amount in the smallest currency unit.
 * @property {string}  currency    - ISO 4217 currency code.
 * @property {Object}  [raw]       - Full raw response from the provider (optional).
 */

/**
 * @typedef {Object} WebhookEvent
 * @property {string}  eventType   - Provider-normalised event type string.
 * @property {string}  paymentId   - Associated provider payment identifier.
 * @property {string}  status      - Normalised payment status after the event.
 * @property {Object}  [raw]       - Full parsed provider payload.
 */

module.exports = PaymentAdapterInterface;
