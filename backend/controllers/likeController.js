const Post = require('../models/Post');
const { createResponse } = require('../utils/helpers');

// Get socket server instance for notifications
let socketServer = null;
const setSocketServer = (server) => {
    socketServer = server;
};

const getNotificationHelper = () => {
    return socketServer?.getNotificationHelper();
};

// Like/Unlike post
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        const isLiked = await post.toggleLike(req.userId);
        
        // Send notification if liked (not unliked) and not own post
        if (isLiked && post.userId && post.userId.toString() !== req.userId) {
            const notificationHelper = getNotificationHelper();
            if (notificationHelper) {
                await notificationHelper.handlePostLike(
                    post._id,
                    post.userId.toString(),
                    req.userId,
                    isLiked
                );
            }
        }
        
        res.json({
            success: true,
            message: isLiked ? 'Post liked' : 'Post unliked',
            data: {
                isLiked,
                likeCount: post.likeCount
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Export setSocketServer function
exports.setSocketServer = setSocketServer;