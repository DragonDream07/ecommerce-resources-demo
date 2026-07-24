const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const AppError = require('../../utils/AppError');
const paymentService = require('../payment/payment.service');

// In-memory session store (replace with Redis or DB-backed sessions in production)
const checkoutSessions = new Map();

/**
 * Starts a checkout session by validating the cart and optionally applying a promo code.
 */
async function startCheckout({ userId, guestEmail, cartId, promoCode }) {
  if (!cartId) {
    throw new AppError('Cart ID is required to start checkout.', 400);
  }

  // Load cart items
  const cartItems = await getCartItems(cartId, userId);
  if (!cartItems || cartItems.length === 0) {
    throw new AppError('Your cart is empty. Please add items before checking out.', 400);
  }

  // Reserve stock for all cart items
  await reserveStock(cartItems);

  // Apply promo code if provided
  let promoResult = null;
  if (promoCode) {
    promoResult = await applyPromoCode(promoCode, cartItems);
  }

  const sessionId = uuidv4();
  const session = {
    sessionId,
    userId,
    guestEmail,
    cartId,
    cartItems,
    promoCode,
    promoResult,
    shippingAddress: null,
    billingAddress: null,
    status: 'initiated',
    createdAt: Date.now(),
  };

  checkoutSessions.set(sessionId, session);

  return {
    checkoutSessionId: sessionId,
    cartItems,
    promo: promoResult,
    status: session.status,
  };
}

/**
 * Validates and stores the shipping/billing address for the checkout session.
 */
async function submitAddress({ userId, checkoutSessionId, shippingAddress, billingAddress, sameAsBilling }) {
  const session = resolveSession(checkoutSessionId, userId);

  const validatedShipping = await validateAddress(shippingAddress);
  const resolvedBilling = sameAsBilling ? { ...shippingAddress } : billingAddress;
  const validatedBilling = await validateAddress(resolvedBilling);

  session.shippingAddress = validatedShipping;
  session.billingAddress = validatedBilling;
  session.status = 'address_submitted';

  return {
    checkoutSessionId,
    shippingAddress: validatedShipping,
    billingAddress: validatedBilling,
    status: session.status,
  };
}

/**
 * Returns the full order review summary for the checkout session.
 */
async function reviewCheckout({ userId, checkoutSessionId }) {
  const session = resolveSession(checkoutSessionId, userId);

  const subtotal = calculateSubtotal(session.cartItems);
  const discount = session.promoResult ? session.promoResult.discountAmount : 0;
  const shipping = calculateShipping(session.shippingAddress);
  const tax = calculateTax(subtotal - discount);
  const total = subtotal - discount + shipping + tax;

  return {
    checkoutSessionId,
    cartItems: session.cartItems,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    promo: session.promoResult,
    pricing: {
      subtotal,
      discount,
      shipping,
      tax,
      total,
    },
    status: session.status,
  };
}

/**
 * Finalises checkout: confirms stock reservation, finalises promo, creates the order,
 * and delegates payment intent creation.
 */
async function placeOrder({ userId, checkoutSessionId, paymentMethod, paymentDetails }) {
  const session = resolveSession(checkoutSessionId, userId);

  if (!session.shippingAddress) {
    throw new AppError('A shipping address must be provided before placing an order.', 400);
  }

  // Confirm stock reservation
  await confirmStockReservation(session.cartItems);

  // Finalise promo code (mark as used)
  if (session.promoCode && session.promoResult) {
    await finalisePromoCode(session.promoCode, userId);
  }

  const subtotal = calculateSubtotal(session.cartItems);
  const discount = session.promoResult ? session.promoResult.discountAmount : 0;
  const shipping = calculateShipping(session.shippingAddress);
  const tax = calculateTax(subtotal - discount);
  const total = subtotal - discount + shipping + tax;

  // Create order record
  const order = await createOrderRecord({
    userId,
    guestEmail: session.guestEmail,
    cartItems: session.cartItems,
    shippingAddress: session.shippingAddress,
    billingAddress: session.billingAddress,
    promoCode: session.promoCode,
    pricing: { subtotal, discount, shipping, tax, total },
    paymentMethod,
  });

  // Delegate payment intent
  const paymentIntent = await paymentService.createPaymentIntent({
    orderId: order.id,
    amount: total,
    currency: 'usd',
    paymentMethod,
    paymentDetails,
    customerId: userId,
    customerEmail: session.guestEmail,
  });

  // Update order with payment intent reference
  await db.query(
    'UPDATE orders SET payment_intent_id = $1, status = $2 WHERE id = $3',
    [paymentIntent.id, 'payment_pending', order.id]
  );

  // Invalidate session
  checkoutSessions.delete(checkoutSessionId);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.clientSecret || null,
    total,
    status: 'payment_pending',
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveSession(checkoutSessionId, userId) {
  if (!checkoutSessionId) {
    throw new AppError('Checkout session ID is required.', 400);
  }
  const session = checkoutSessions.get(checkoutSessionId);
  if (!session) {
    throw new AppError('Checkout session not found or has expired.', 404);
  }
  // For authenticated users, enforce ownership
  if (userId && session.userId && session.userId !== userId) {
    throw new AppError('You do not have access to this checkout session.', 403);
  }
  return session;
}

async function getCartItems(cartId, userId) {
  let rows;
  if (userId) {
    const result = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price,
              p.name, p.sku, p.stock_quantity
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       WHERE c.id = $1 AND c.user_id = $2`,
      [cartId, userId]
    );
    rows = result.rows;
  } else {
    const result = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price,
              p.name, p.sku, p.stock_quantity
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       WHERE c.id = $1`,
      [cartId]
    );
    rows = result.rows;
  }
  return rows.map((row) => ({
    cartItemId: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    stockQuantity: row.stock_quantity,
  }));
}

async function reserveStock(cartItems) {
  for (const item of cartItems) {
    if (item.stockQuantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for product "${item.name}". Only ${item.stockQuantity} unit(s) available.`,
        409
      );
    }
    await db.query(
      'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
      [item.quantity, item.productId]
    );
  }
}

async function confirmStockReservation(cartItems) {
  // Re-verify that the reservation still holds (no race condition)
  for (const item of cartItems) {
    const result = await db.query(
      'SELECT stock_quantity FROM products WHERE id = $1',
      [item.productId]
    );
    const currentStock = result.rows[0] ? result.rows[0].stock_quantity : 0;
    // Allow negative only up to the reserved amount (i.e. current + reserved >= 0)
    if (currentStock < 0) {
      throw new AppError(
        `Stock for product "${item.name}" is no longer available. Please review your cart.`,
        409
      );
    }
  }
}

async function validateAddress(address) {
  if (!address) {
    throw new AppError('Address is required.', 400);
  }
  const { line1, city, state, postalCode, country } = address;
  if (!line1 || !city || !postalCode || !country) {
    throw new AppError('Address must include line1, city, postalCode, and country.', 400);
  }
  // Normalise
  return {
    line1: line1.trim(),
    line2: address.line2 ? address.line2.trim() : null,
    city: city.trim(),
    state: state ? state.trim() : null,
    postalCode: postalCode.trim(),
    country: country.trim().toUpperCase(),
  };
}

async function applyPromoCode(promoCode, cartItems) {
  const result = await db.query(
    `SELECT id, code, discount_type, discount_value, min_order_amount, usage_limit, usage_count, expires_at
     FROM promo_codes
     WHERE code = $1 AND is_active = true`,
    [promoCode]
  );
  const promo = result.rows[0];
  if (!promo) {
    throw new AppError('The promo code entered is invalid or has expired.', 400);
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    throw new AppError('The promo code entered is invalid or has expired.', 400);
  }
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    throw new AppError('This promo code has reached its usage limit.', 400);
  }
  const subtotal = calculateSubtotal(cartItems);
  if (promo.min_order_amount && subtotal < parseFloat(promo.min_order_amount)) {
    throw new AppError(
      `This promo code requires a minimum order amount of $${parseFloat(promo.min_order_amount).toFixed(2)}.`,
      400
    );
  }
  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = parseFloat(((subtotal * parseFloat(promo.discount_value)) / 100).toFixed(2));
  } else if (promo.discount_type === 'fixed') {
    discountAmount = Math.min(parseFloat(promo.discount_value), subtotal);
  }
  return {
    promoId: promo.id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: parseFloat(promo.discount_value),
    discountAmount,
  };
}

async function finalisePromoCode(promoCode, userId) {
  await db.query(
    'UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = $1',
    [promoCode]
  );
  if (userId) {
    await db.query(
      'INSERT INTO promo_code_usages (promo_code, user_id, used_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [promoCode, userId]
    );
  }
}

function calculateSubtotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function calculateShipping(shippingAddress) {
  // Flat-rate shipping; extend with carrier API as needed
  if (!shippingAddress) return 0;
  return shippingAddress.country === 'US' ? 5.99 : 14.99;
}

function calculateTax(taxableAmount) {
  // Simple flat tax rate; extend with jurisdiction logic as needed
  const TAX_RATE = 0.08;
  return parseFloat((taxableAmount * TAX_RATE).toFixed(2));
}

async function createOrderRecord({ userId, guestEmail, cartItems, shippingAddress, billingAddress, promoCode, pricing, paymentMethod }) {
  const orderNumber = generateOrderNumber();
  const result = await db.query(
    `INSERT INTO orders
       (order_number, user_id, guest_email, status, subtotal, discount, shipping_cost, tax, total,
        promo_code, payment_method, shipping_address, billing_address, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     RETURNING id, order_number`,
    [
      orderNumber,
      userId || null,
      guestEmail || null,
      'pending',
      pricing.subtotal,
      pricing.discount,
      pricing.shipping,
      pricing.tax,
      pricing.total,
      promoCode || null,
      paymentMethod,
      JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress),
    ]
  );
  const order = result.rows[0];

  // Insert order line items
  for (const item of cartItems) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, item.productId, item.quantity, item.unitPrice, item.unitPrice * item.quantity]
    );
  }

  return { id: order.id, orderNumber: order.order_number };
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

module.exports = {
  startCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
