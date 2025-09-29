const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const pushController = require('../controllers/pushNotificationController');

// Subscribe to push notifications
router.post('/subscribe', authMiddleware, pushController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', authMiddleware, pushController.unsubscribe);

// Send test notification
router.post('/test', authMiddleware, pushController.sendTestNotification);

// Get user's subscriptions
router.get('/subscriptions', authMiddleware, pushController.getSubscriptions);

module.exports = router;
