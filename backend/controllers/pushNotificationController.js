const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushNotificationService');

// Subscribe to push notifications
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.userId;

    // Validate subscription data
    if (!pushService.isValidSubscription(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    // Check if subscription already exists
    let subscription = await PushSubscription.findByEndpoint(endpoint);
    
    if (subscription) {
      // Update existing subscription
      subscription.userId = userId;
      subscription.keys = keys;
      subscription.isActive = true;
      subscription.lastUsed = new Date();
      subscription.userAgent = req.get('User-Agent');
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new PushSubscription({
        userId,
        endpoint,
        keys,
        userAgent: req.get('User-Agent')
      });
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscriptionId: subscription._id
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications'
    });
  }
};

// Unsubscribe from push notifications
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    await PushSubscription.deactivateByEndpoint(endpoint);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });

  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    });
  }
};

// Send test notification
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, body } = req.body;

    // Get user's subscriptions
    const subscriptions = await PushSubscription.findByUserId(userId);

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscriptions found'
      });
    }

    // Create test payload
    const payload = {
      title: title || 'Test Notification',
      body: body || 'This is a test notification from HooksDream',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        type: 'TEST',
        url: '/'
      }
    };

    // Send to all user's subscriptions
    const subscriptionObjects = subscriptions.map(sub => sub.toSubscriptionObject());
    const results = await pushService.sendBulkNotifications(subscriptionObjects, payload);

    // Clean up failed subscriptions
    const failedEndpoints = results
      .filter(result => result.expired)
      .map(result => result.subscription);

    if (failedEndpoints.length > 0) {
      await Promise.all(
        failedEndpoints.map(endpoint => 
          PushSubscription.deactivateByEndpoint(endpoint)
        )
      );
    }

    res.json({
      success: true,
      message: 'Test notification sent',
      results: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        expired: results.filter(r => r.expired).length
      }
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
};

// Get user's subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;
    
    const subscriptions = await PushSubscription.findByUserId(userId);
    
    res.json({
      success: true,
      data: subscriptions.map(sub => ({
        id: sub._id,
        endpoint: sub.endpoint.substring(0, 50) + '...', // Truncate for security
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed
      }))
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions'
    });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  sendTestNotification,
  getSubscriptions
};
