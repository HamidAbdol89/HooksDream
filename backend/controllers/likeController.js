const Post = require('../models/Post');
const { createResponse } = require('../utils/helpers');

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