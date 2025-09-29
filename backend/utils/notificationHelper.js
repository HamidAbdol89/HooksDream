const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushNotificationService');

class NotificationHelper {
  // Send notification to specific user
  async sendToUser(userId, type, data) {
    try {
      const subscriptions = await PushSubscription.findByUserId(userId);
      
      if (subscriptions.length === 0) {
        return { success: false, message: 'No subscriptions found' };
      }

      const payload = pushService.createPayload(type, data);
      if (!payload) {
        return { success: false, message: 'Invalid notification type' };
      }

      const subscriptionObjects = subscriptions.map(sub => sub.toSubscriptionObject());
      const results = await pushService.sendBulkNotifications(subscriptionObjects, payload);

      // Clean up expired subscriptions
      const expiredEndpoints = results
        .filter(result => result.expired)
        .map(result => result.subscription);

      if (expiredEndpoints.length > 0) {
        await Promise.all(
          expiredEndpoints.map(endpoint => 
            PushSubscription.deactivateByEndpoint(endpoint)
          )
        );
      }

      return {
        success: true,
        results: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };

    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send new message notification
  async notifyNewMessage(recipientId, senderName, messagePreview, conversationId, messageId) {
    return this.sendToUser(recipientId, 'NEW_MESSAGE', {
      senderName,
      messagePreview,
      conversationId,
      messageId
    });
  }

  // Send new follower notification
  async notifyNewFollower(userId, followerName, followerId, followerUsername) {
    return this.sendToUser(userId, 'NEW_FOLLOWER', {
      followerName,
      followerId,
      followerUsername
    });
  }

  // Send post like notification
  async notifyPostLike(postOwnerId, likerName, postId) {
    return this.sendToUser(postOwnerId, 'POST_LIKE', {
      likerName,
      postId
    });
  }

  // Send new comment notification
  async notifyNewComment(postOwnerId, commenterName, postId, commentId) {
    return this.sendToUser(postOwnerId, 'NEW_COMMENT', {
      commenterName,
      postId,
      commentId
    });
  }
}

module.exports = new NotificationHelper();
