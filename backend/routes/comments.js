const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// GET /api/comments/:id/replies - Lấy replies của một comment
router.get('/:id/replies', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Kiểm tra parent comment có tồn tại không
        const parentComment = await Comment.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!parentComment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        const replies = await Comment.getCommentReplies(id, page, limit);
        const total = await Comment.countDocuments({
            parentCommentId: id,
            isDeleted: false
        });
        
        // Thêm thông tin user đã like reply hay chưa
        const repliesWithLikeInfo = replies.map(reply => {
            const replyData = reply.toObject();
            if (req.userId) {
                replyData.isLiked = reply.isLikedBy(req.userId);
            }
            return replyData;
        });
        
        res.json({
            success: true,
            data: repliesWithLikeInfo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Get comment replies error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Thêm route này vào file comments.js (sau route GET /:id/replies)
// POST /api/comments/:id/reply - Tạo reply cho một comment
router.post('/:id/reply', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, image } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        // Kiểm tra parent comment có tồn tại không
        const parentComment = await Comment.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!parentComment) {
            return res.status(404).json({
                success: false,
                message: 'Parent comment not found'
            });
        }
        
        // Tạo reply
        const reply = new Comment({
            postId: parentComment.postId,
            userId: req.userId,
            content: content.trim(),
            parentCommentId: id,
            image: image || ''
        });
        
        await reply.save();
        await reply.populate('userId', 'username displayName avatar isVerified');
        
        // Cập nhật replyCount của parent comment
        await Comment.findByIdAndUpdate(id, { 
            $inc: { replyCount: 1 } 
        });
        
        res.status(201).json({
            success: true,
            message: 'Reply created successfully',
            data: reply
        });
        
    } catch (error) {
        console.error('❌ Create reply error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// PUT /api/comments/:id - Cập nhật comment
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, image } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const comment = await Comment.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        // Check ownership
        if (comment.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Update fields
        comment.content = content.trim();
        if (image !== undefined) comment.image = image;
        
        await comment.save();
        await comment.populate('userId', 'username displayName avatar isVerified');
        
        res.json({
            success: true,
            message: 'Comment updated successfully',
            data: comment
        });
        
    } catch (error) {
        console.error('❌ Update comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE /api/comments/:id - Xóa comment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const comment = await Comment.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        // Check ownership
        if (comment.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Soft delete
        await comment.softDelete();
        
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/comments/:id/like - Like/Unlike comment
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const comment = await Comment.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        const isLiked = await comment.toggleLike(req.userId);
        
        res.json({
            success: true,
            message: isLiked ? 'Comment liked' : 'Comment unliked',
            data: {
                isLiked,
                likeCount: comment.likeCount
            }
        });
        
    } catch (error) {
        console.error('❌ Like comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/comments/user/:userId - Lấy comments của một user
router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const comments = await Comment.find({
            userId: userId,
            isDeleted: false
        })
        .populate('userId', 'username displayName avatar isVerified')
        .populate('postId', 'content userId')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            comments.forEach(comment => {
                comment.isLiked = comment.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Comment.countDocuments({
            userId: userId,
            isDeleted: false
        });
        
        res.json({
            success: true,
            data: comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Get user comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;