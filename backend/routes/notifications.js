const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const pushController = require('../controllers/pushNotificationController');
const notificationController = require('../controllers/notificationController');

// ===== NOTIFICATION MANAGEMENT =====

// Get notifications for current user
router.get('/', authMiddleware, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', authMiddleware, notificationController.clearAllNotifications);

// Get notification settings
router.get('/settings', authMiddleware, notificationController.getSettings);

// Update notification settings
router.patch('/settings', authMiddleware, notificationController.updateSettings);

// ===== PUSH NOTIFICATION MANAGEMENT =====

// Subscribe to push notifications
router.post('/push/subscribe', authMiddleware, pushController.subscribe);

// Unsubscribe from push notifications
router.post('/push/unsubscribe', authMiddleware, pushController.unsubscribe);

// Send test notification
router.post('/push/test', authMiddleware, pushController.sendTestNotification);

// Get user's subscriptions
router.get('/push/subscriptions', authMiddleware, pushController.getSubscriptions);

module.exports = router;
