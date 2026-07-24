const db = require('../../db');

/**
 * Create a notification for a user. Called by other services.
 * @param {object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type
 * @param {string} params.title - Short title
 * @param {string} params.message - Notification body
 * @param {object} [params.meta] - Optional metadata/payload
 * @returns {Promise<object>} Created notification
 */
async function createNotification({ userId, type, title, message, meta = null }) {
  const [notification] = await db('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      meta: meta ? JSON.stringify(meta) : null,
      is_read: false,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');
  return notification;
}

/**
 * Retrieve paginated notifications for a user.
 * @param {string} userId
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {boolean} options.unreadOnly
 * @returns {Promise<{data: object[], total: number, unreadCount: number, page: number, limit: number}>}
 */
async function getNotificationsForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const offset = (page - 1) * limit;

  let query = db('notifications').where({ user_id: userId });
  if (unreadOnly) {
    query = query.where({ is_read: false });
  }

  const [{ count: total }] = await query.clone().count('id as count');
  const data = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('*');

  const [{ count: unreadCount }] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');

  return {
    data,
    total: parseInt(total, 10),
    unreadCount: parseInt(unreadCount, 10),
    page,
    limit,
  };
}

/**
 * Retrieve a single notification by ID for a user.
 * @param {string} userId
 * @param {string} notificationId
 * @returns {Promise<object|null>}
 */
async function getNotificationById(userId, notificationId) {
  const notification = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();
  return notification || null;
}

/**
 * Get unread notification count for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const [{ count }] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');
  return parseInt(count, 10);
}

/**
 * Mark a single notification as read.
 * @param {string} userId
 * @param {string} notificationId
 * @returns {Promise<object|null>} Updated notification or null if not found
 */
async function markNotificationRead(userId, notificationId) {
  const [updated] = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .update({ is_read: true, updated_at: db.fn.now() })
    .returning('*');
  return updated || null;
}

/**
 * Mark all notifications as read for a user.
 * @param {string} userId
 * @returns {Promise<number>} Number of notifications updated
 */
async function markAllNotificationsRead(userId) {
  const count = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true, updated_at: db.fn.now() });
  return count;
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getNotificationById,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
