const notificationsService = require('./notifications.service');

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const result = await notificationsService.getNotificationsForUser(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true',
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    const notification = await notificationsService.getNotificationById(userId, notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    const updated = await notificationsService.markNotificationRead(userId, notificationId);
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    return res.status(200).json({ message: 'Notification marked as read.', notification: updated });
  } catch (err) {
    next(err);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.id;
    await notificationsService.markAllNotificationsRead(userId);
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
};
