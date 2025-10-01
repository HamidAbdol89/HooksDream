const Notification = require('../models/Notification');
const Follow = require('../models/Follow');

class NotificationHelper {
    constructor(socketServer) {
        this.socketServer = socketServer;
    }

    // Create and emit notification
    async createAndEmitNotification(data) {
        try {
            const notification = await Notification.createNotification(data);
            
            if (notification) {
                // Emit real-time notification to recipient
                this.socketServer.emitToUser(data.recipient, 'notification:new', {
                    notification: await notification.populate('sender', 'displayName username avatar isVerified'),
                    unreadCount: await Notification.getUnreadCount(data.recipient)
                });

                return notification;
            }
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    // Handle post like notification
    async handlePostLike(postId, postAuthorId, likerId, isLiked) {
        if (isLiked) {
            await this.createAndEmitNotification({
                recipient: postAuthorId,
                sender: likerId,
                type: 'like',
                entityType: 'post',
                entityId: postId,
                metadata: { postId }
            });
        }
    }

    // Handle comment notification
    async handleComment(postId, postAuthorId, commenterId, commentId) {
        await this.createAndEmitNotification({
            recipient: postAuthorId,
            sender: commenterId,
            type: 'comment',
            entityType: 'comment',
            entityId: commentId,
            metadata: { postId, commentId }
        });
    }

    // Handle reply notification
    async handleReply(postId, commentAuthorId, replierId, replyId, parentCommentId) {
        await this.createAndEmitNotification({
            recipient: commentAuthorId,
            sender: replierId,
            type: 'reply',
            entityType: 'comment',
            entityId: replyId,
            metadata: { postId, commentId: replyId, parentCommentId }
        });
    }

    // Handle follow notification
    async handleFollow(followerId, followingId) {
        await this.createAndEmitNotification({
            recipient: followingId,
            sender: followerId,
            type: 'follow',
            entityType: 'user',
            entityId: followerId
        });
    }

    // Handle repost notification
    async handleRepost(originalPostId, originalAuthorId, reposterId) {
        await this.createAndEmitNotification({
            recipient: originalAuthorId,
            sender: reposterId,
            type: 'repost',
            entityType: 'post',
            entityId: originalPostId,
            metadata: { postId: originalPostId }
        });
    }

    // Handle new post from following
    async handleNewPostFromFollowing(postId, authorId) {
        try {
            // Get all followers of the post author
            const followers = await Follow.find({ following: authorId }).select('follower');
            
            // Create notifications for all followers
            const notifications = followers.map(follow => ({
                recipient: follow.follower,
                sender: authorId,
                type: 'post_from_following',
                entityType: 'post',
                entityId: postId,
                metadata: { postId }
            }));

            // Batch create notifications
            if (notifications.length > 0) {
                const createdNotifications = await Promise.all(
                    notifications.map(data => Notification.createNotification(data))
                );

                // Emit to all followers
                for (const notification of createdNotifications) {
                    if (notification) {
                        const populatedNotification = await notification.populate('sender', 'displayName username avatar isVerified');
                        const unreadCount = await Notification.getUnreadCount(notification.recipient);
                        
                        this.socketServer.emitToUser(notification.recipient, 'notification:new', {
                            notification: populatedNotification,
                            unreadCount
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling new post notification:', error);
        }
    }

    // Handle mention notification (for future implementation)
    async handleMention(postId, mentionedUserId, mentionerId) {
        await this.createAndEmitNotification({
            recipient: mentionedUserId,
            sender: mentionerId,
            type: 'mention',
            entityType: 'post',
            entityId: postId,
            metadata: { postId }
        });
    }

    // Emit unread count update
    async emitUnreadCountUpdate(userId) {
        try {
            const unreadCount = await Notification.getUnreadCount(userId);
            this.socketServer.emitToUser(userId, 'notification:unread_count', { unreadCount });
        } catch (error) {
            console.error('Error emitting unread count update:', error);
        }
    }
}

module.exports = NotificationHelper;
