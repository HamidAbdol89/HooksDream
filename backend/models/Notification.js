const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: String,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: String,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'like',           // Someone liked your post
            'comment',        // Someone commented on your post
            'reply',          // Someone replied to your comment
            'follow',         // Someone followed you
            'repost',         // Someone reposted your post
            'mention',        // Someone mentioned you
            'post_from_following' // Someone you follow posted
        ]
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 255
    },
    // Reference to the related entity
    entityType: {
        type: String,
        enum: ['post', 'comment', 'user'],
        required: true
    },
    entityId: {
        type: String,
        required: true
    },
    // Additional metadata
    metadata: {
        postId: String,
        commentId: String,
        parentCommentId: String,
        postTitle: String,
        postPreview: String
    },
    // Status tracking
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// TTL index - auto delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for notification URL
NotificationSchema.virtual('url').get(function() {
    switch (this.entityType) {
        case 'post':
            return `/post/${this.entityId}`;
        case 'comment':
            return `/post/${this.metadata.postId}#comment-${this.entityId}`;
        case 'user':
            return `/profile/${this.entityId}`;
        default:
            return '/notifications';
    }
});

// Methods
NotificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

NotificationSchema.methods.softDelete = function() {
    this.isDeleted = true;
    return this.save();
};

// Static methods
NotificationSchema.statics.createNotification = async function(data) {
    const {
        recipient,
        sender,
        type,
        entityType,
        entityId,
        metadata = {}
    } = data;

    // Don't create notification for self-actions
    if (recipient === sender) {
        return null;
    }

    // Generate title and message based on type
    const { title, message } = await this.generateNotificationContent(type, sender, metadata);

    const notification = new this({
        recipient,
        sender,
        type,
        title,
        message,
        entityType,
        entityId,
        metadata
    });

    return await notification.save();
};

NotificationSchema.statics.generateNotificationContent = async function(type, senderId, metadata) {
    const User = mongoose.model('User');
    const sender = await User.findById(senderId).select('displayName username');
    const senderName = sender?.displayName || sender?.username || 'Someone';

    const contentMap = {
        like: {
            title: 'New Like',
            message: `${senderName} liked your post`
        },
        comment: {
            title: 'New Comment',
            message: `${senderName} commented on your post`
        },
        reply: {
            title: 'New Reply',
            message: `${senderName} replied to your comment`
        },
        follow: {
            title: 'New Follower',
            message: `${senderName} started following you`
        },
        repost: {
            title: 'New Repost',
            message: `${senderName} reposted your post`
        },
        mention: {
            title: 'You were mentioned',
            message: `${senderName} mentioned you in a post`
        },
        post_from_following: {
            title: 'New Post',
            message: `${senderName} shared a new post`
        }
    };

    return contentMap[type] || {
        title: 'New Notification',
        message: `${senderName} interacted with your content`
    };
};

// Get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false,
        isDeleted: false
    });
};

// Mark all notifications as read for user
NotificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { recipient: userId, isRead: false },
        { 
            isRead: true, 
            readAt: new Date() 
        }
    );
};

// Ensure virtuals are included in JSON
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', NotificationSchema);
