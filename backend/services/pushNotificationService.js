const webpush = require('web-push');

class PushNotificationService {
  constructor() {
    // Configure web-push with VAPID keys only if they exist and are valid
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@hooksdream.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        console.log('✅ Push notifications configured');
      } catch (error) {
        console.warn('⚠️  Push notifications disabled - Invalid VAPID keys:', error.message);
        this.disabled = true;
      }
    } else {
      console.warn('⚠️  Push notifications disabled - VAPID keys not found');
      this.disabled = true;
    }
  }

  // Send notification to a single subscription
  async sendNotification(subscription, payload, options = {}) {
    if (this.disabled) {
      return { success: false, error: 'Push notifications disabled' };
    }

    try {
      const defaultOptions = {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'normal',
        headers: {}
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        finalOptions
      );

      return { success: true, result };
    } catch (error) {
      console.error('Push notification failed:', error);
      
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, expired: true, error };
      }
      
      return { success: false, error };
    }
  }

  // Send notification to multiple subscriptions
  async sendBulkNotifications(subscriptions, payload, options = {}) {
    const results = [];
    
    for (const subscription of subscriptions) {
      const result = await this.sendNotification(subscription, payload, options);
      results.push({
        subscription: subscription.endpoint,
        ...result
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
  }

  // Create notification payload
  createPayload(type, data) {
    const payloads = {
      NEW_MESSAGE: {
        title: `${data.senderName} sent you a message`,
        body: data.messagePreview || 'New message',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `message-${data.conversationId}`,
        data: {
          type: 'NEW_MESSAGE',
          conversationId: data.conversationId,
          messageId: data.messageId,
          url: `/messages?conversation=${data.conversationId}`
        },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/icon-reply.png'
          },
          {
            action: 'view',
            title: 'View',
            icon: '/icon-view.png'
          }
        ]
      },

      NEW_FOLLOWER: {
        title: 'New Follower',
        body: `${data.followerName} started following you`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `follower-${data.followerId}`,
        data: {
          type: 'NEW_FOLLOWER',
          followerId: data.followerId,
          url: `/profile/${data.followerUsername}`
        },
        actions: [
          {
            action: 'view_profile',
            title: 'View Profile',
            icon: '/icon-profile.png'
          }
        ]
      },

      POST_LIKE: {
        title: 'Post Liked',
        body: `${data.likerName} liked your post`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `like-${data.postId}`,
        data: {
          type: 'POST_LIKE',
          postId: data.postId,
          url: `/post/${data.postId}`
        }
      },

      NEW_COMMENT: {
        title: 'New Comment',
        body: `${data.commenterName} commented on your post`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `comment-${data.postId}`,
        data: {
          type: 'NEW_COMMENT',
          postId: data.postId,
          commentId: data.commentId,
          url: `/post/${data.postId}#comment-${data.commentId}`
        }
      }
    };

    return payloads[type] || null;
  }

  // Validate subscription object
  isValidSubscription(subscription) {
    return subscription &&
           subscription.endpoint &&
           subscription.keys &&
           subscription.keys.p256dh &&
           subscription.keys.auth;
  }
}

module.exports = new PushNotificationService();
