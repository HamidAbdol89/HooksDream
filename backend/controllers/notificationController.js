const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationController {
    // Get notifications for current user
    async getNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const notifications = await Notification.find({
                recipient: userId,
                isDeleted: false
            })
            .populate('sender', 'displayName username avatar isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

            // Get total count for pagination
            const totalCount = await Notification.countDocuments({
                recipient: userId,
                isDeleted: false
            });

            // Get unread count
            const unreadCount = await Notification.getUnreadCount(userId);

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalCount / limit),
                        totalCount,
                        hasMore: skip + notifications.length < totalCount
                    },
                    unreadCount
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching notifications',
                error: error.message
            });
        }
    }

    // Get unread count only
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.userId;
            const unreadCount = await Notification.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching unread count',
                error: error.message
            });
        }
    }

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const { notificationId } = req.params;

            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: userId
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            await notification.markAsRead();

            // Get updated unread count
            const unreadCount = await Notification.getUnreadCount(userId);

            res.json({
                success: true,
                data: { 
                    notification,
                    unreadCount 
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error marking notification as read',
                error: error.message
            });
        }
    }

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId;

            await Notification.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read',
                data: { unreadCount: 0 }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error marking all notifications as read',
                error: error.message
            });
        }
    }

    // Delete notification
    async deleteNotification(req, res) {
        try {
            const userId = req.user.userId;
            const { notificationId } = req.params;

            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: userId
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            await notification.softDelete();

            // Get updated unread count
            const unreadCount = await Notification.getUnreadCount(userId);

            res.json({
                success: true,
                message: 'Notification deleted',
                data: { unreadCount }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting notification',
                error: error.message
            });
        }
    }

    // Clear all notifications
    async clearAllNotifications(req, res) {
        try {
            const userId = req.user.userId;

            await Notification.updateMany(
                { recipient: userId },
                { isDeleted: true }
            );

            res.json({
                success: true,
                message: 'All notifications cleared',
                data: { unreadCount: 0 }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error clearing notifications',
                error: error.message
            });
        }
    }

    // Get notification settings (placeholder for future)
    async getSettings(req, res) {
        try {
            const userId = req.user.userId;
            
            // Default settings - can be expanded to user preferences
            const settings = {
                likes: true,
                comments: true,
                follows: true,
                reposts: true,
                mentions: true,
                posts_from_following: true,
                email_notifications: false,
                push_notifications: true
            };

            res.json({
                success: true,
                data: { settings }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching notification settings',
                error: error.message
            });
        }
    }

    // Update notification settings (placeholder for future)
    async updateSettings(req, res) {
        try {
            const userId = req.user.userId;
            const settings = req.body;

            // TODO: Save to user preferences
            
            res.json({
                success: true,
                message: 'Notification settings updated',
                data: { settings }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating notification settings',
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();
