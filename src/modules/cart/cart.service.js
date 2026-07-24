const db = require('../../db');
const { AppError } = require('../../utils/errors');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a cart row together with its items.
 * Throws 404 if not found.
 */
async function fetchCartWithItems(cartId) {
  const cartRow = await db('carts').where({ id: cartId }).first();
  if (!cartRow) {
    throw new AppError('Cart not found.', 404);
  }
  const items = await db('cart_items')
    .where({ cart_id: cartId })
    .orderBy('created_at', 'asc');
  return { ...cartRow, items };
}

/**
 * Assert that the requesting principal (user or session) owns the cart.
 */
function assertOwnership(cart, { userId, sessionId }) {
  if (userId) {
    if (cart.user_id && cart.user_id !== userId) {
      throw new AppError('Access denied to this cart.', 403);
    }
    return;
  }
  if (sessionId) {
    if (cart.session_id && cart.session_id !== sessionId) {
      throw new AppError('Access denied to this cart.', 403);
    }
    return;
  }
  // Neither userId nor sessionId supplied — deny access
  throw new AppError('Access denied to this cart.', 403);
}

/**
 * Check stock availability for a given product/variant and quantity.
 * Throws 422 if stock is insufficient.
 */
async function assertStockAvailable(productId, variantId, quantity) {
  const stockRow = await db('product_variants')
    .where({ id: variantId, product_id: productId })
    .first();

  if (!stockRow) {
    throw new AppError('Product variant not found.', 404);
  }

  if (stockRow.stock_quantity < quantity) {
    throw new AppError(
      `Insufficient stock. Only ${stockRow.stock_quantity} unit(s) available.`,
      422
    );
  }
}

/**
 * Compute cart totals (subtotal, discount, total) from its items and promo.
 */
async function computeTotals(items, promoRow) {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  let discount = 0;

  if (promoRow) {
    if (promoRow.discount_type === 'percentage') {
      discount = subtotal * (promoRow.discount_value / 100);
    } else if (promoRow.discount_type === 'fixed') {
      discount = promoRow.discount_value;
    }
    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal);
  }

  const total = subtotal - discount;
  return { subtotal, discount, total };
}

// ---------------------------------------------------------------------------
// Exported service methods
// ---------------------------------------------------------------------------

/**
 * REQ-15, REQ-27
 * Create a new cart for a user or a guest session.
 * If the user already has an active cart, merge the guest cart into it.
 */
async function createCart({ userId, sessionId }) {
  // If authenticated, check for an existing active cart and return it
  if (userId) {
    const existing = await db('carts')
      .where({ user_id: userId, status: 'active' })
      .first();
    if (existing) {
      // Merge: if a sessionId is also provided, pull guest items into the user cart
      if (sessionId) {
        await mergeGuestCart({ guestSessionId: sessionId, userCartId: existing.id });
      }
      return fetchCartWithItems(existing.id);
    }
  }

  // Create a fresh cart
  const [cartId] = await db('carts').insert({
    user_id: userId || null,
    session_id: !userId ? sessionId : null,
    status: 'active',
    promo_code: null,
    promo_id: null,
  });

  return fetchCartWithItems(cartId);
}

/**
 * REQ-16
 * Retrieve a cart by id, merging guest items for authenticated users when applicable.
 */
async function getCart({ cartId, userId, sessionId }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId });

  // If the cart has no user but the caller is authenticated, claim it
  if (userId && !cart.user_id) {
    await db('carts').where({ id: cartId }).update({ user_id: userId, session_id: null });
    cart.user_id = userId;
    cart.session_id = null;
  }

  const promoRow = cart.promo_id
    ? await db('promo_codes').where({ id: cart.promo_id }).first()
    : null;

  const totals = await computeTotals(cart.items, promoRow);
  return { ...cart, ...totals };
}

/**
 * REQ-18, REQ-19, REQ-20, REQ-21
 * Add an item to the cart.
 * Validates stock availability before insertion.
 * If the same variant already exists in the cart, increments the quantity.
 */
async function addItem({ cartId, userId, productId, variantId, quantity }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId: null });

  if (cart.status !== 'active') {
    throw new AppError('Cannot modify a cart that is not active.', 422);
  }

  await assertStockAvailable(productId, variantId, quantity);

  // Fetch the unit price from the variant
  const variantRow = await db('product_variants')
    .where({ id: variantId, product_id: productId })
    .first();

  const existingItem = await db('cart_items')
    .where({ cart_id: cartId, product_id: productId, variant_id: variantId })
    .first();

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    await assertStockAvailable(productId, variantId, newQty);
    await db('cart_items')
      .where({ id: existingItem.id })
      .update({ quantity: newQty, updated_at: db.fn.now() });
  } else {
    await db('cart_items').insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
      unit_price: variantRow.price,
    });
  }

  return getCart({ cartId, userId, sessionId: null });
}

/**
 * REQ-22, REQ-23, REQ-24
 * Update the quantity of an existing cart item.
 * Validates stock availability.
 * Removing an item by setting quantity to 0 is delegated to removeItem.
 */
async function updateItem({ cartId, itemId, userId, quantity }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId: null });

  if (cart.status !== 'active') {
    throw new AppError('Cannot modify a cart that is not active.', 422);
  }

  const item = cart.items.find((i) => String(i.id) === String(itemId));
  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  if (quantity === 0) {
    return removeItem({ cartId, itemId, userId });
  }

  await assertStockAvailable(item.product_id, item.variant_id, quantity);

  await db('cart_items')
    .where({ id: itemId, cart_id: cartId })
    .update({ quantity, updated_at: db.fn.now() });

  return getCart({ cartId, userId, sessionId: null });
}

/**
 * REQ-25, REQ-26
 * Remove an item from the cart.
 */
async function removeItem({ cartId, itemId, userId }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId: null });

  if (cart.status !== 'active') {
    throw new AppError('Cannot modify a cart that is not active.', 422);
  }

  const item = cart.items.find((i) => String(i.id) === String(itemId));
  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  await db('cart_items').where({ id: itemId, cart_id: cartId }).delete();

  return getCart({ cartId, userId, sessionId: null });
}

/**
 * REQ-28, REQ-29, REQ-30
 * Apply a promo code to the cart.
 * Validates promo code existence, validity period, and usage limits.
 */
async function applyPromo({ cartId, userId, promoCode }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId: null });

  if (cart.status !== 'active') {
    throw new AppError('Cannot modify a cart that is not active.', 422);
  }

  const promo = await db('promo_codes')
    .where({ code: promoCode, is_active: true })
    .first();

  if (!promo) {
    throw new AppError('Promo code is invalid or has expired.', 422);
  }

  const now = new Date();
  if (promo.valid_from && new Date(promo.valid_from) > now) {
    throw new AppError('Promo code is not yet valid.', 422);
  }
  if (promo.valid_until && new Date(promo.valid_until) < now) {
    throw new AppError('Promo code has expired.', 422);
  }
  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    throw new AppError('Promo code usage limit has been reached.', 422);
  }

  await db('carts')
    .where({ id: cartId })
    .update({ promo_code: promoCode, promo_id: promo.id, updated_at: db.fn.now() });

  return getCart({ cartId, userId, sessionId: null });
}

/**
 * REQ-31
 * Remove the applied promo code from the cart.
 */
async function removePromo({ cartId, userId }) {
  const cart = await fetchCartWithItems(cartId);
  assertOwnership(cart, { userId, sessionId: null });

  if (cart.status !== 'active') {
    throw new AppError('Cannot modify a cart that is not active.', 422);
  }

  await db('carts')
    .where({ id: cartId })
    .update({ promo_code: null, promo_id: null, updated_at: db.fn.now() });

  return getCart({ cartId, userId, sessionId: null });
}

/**
 * REQ-27
 * Merge guest cart items into an authenticated user's active cart.
 * Items that already exist in the target cart have their quantities summed.
 * The guest cart is then marked as merged.
 */
async function mergeGuestCart({ guestSessionId, userCartId }) {
  const guestCart = await db('carts')
    .where({ session_id: guestSessionId, status: 'active' })
    .first();

  if (!guestCart || guestCart.id === userCartId) {
    return;
  }

  const guestItems = await db('cart_items').where({ cart_id: guestCart.id });

  for (const guestItem of guestItems) {
    const existing = await db('cart_items')
      .where({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id,
      })
      .first();

    if (existing) {
      await db('cart_items')
        .where({ id: existing.id })
        .update({
          quantity: existing.quantity + guestItem.quantity,
          updated_at: db.fn.now(),
        });
    } else {
      await db('cart_items').insert({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id,
        quantity: guestItem.quantity,
        unit_price: guestItem.unit_price,
      });
    }
  }

  // Mark the guest cart as merged so it is no longer active
  await db('carts').where({ id: guestCart.id }).update({ status: 'merged', updated_at: db.fn.now() });
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
  mergeGuestCart,
};
