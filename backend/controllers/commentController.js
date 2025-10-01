const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose'); // THÊM IMPORT NÀY
const { createResponse } = require('../utils/helpers');

// Get socket server instance for notifications
let socketServer = null;
const setSocketServer = (server) => {
    socketServer = server;
};

const getNotificationHelper = () => {
    return socketServer?.getNotificationHelper();
};

// Lấy comments của post
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        // Kiểm tra post có tồn tại không
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
        
        const comments = await Comment.getPostComments(id, page, limit);
        const total = await Comment.countDocuments({
            postId: id,
            parentCommentId: null,
            isDeleted: false
        });
        
        // Thêm thông tin user đã like comment hay chưa
        const commentsWithLikeInfo = comments.map(comment => {
            const commentData = comment.toObject();
            if (req.userId) {
                commentData.isLiked = comment.isLikedBy(req.userId);
                }
            return commentData;
        });
        
        res.json({
            success: true,
            data: commentsWithLikeInfo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Tạo comment mới
exports.createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentCommentId, image } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        // Kiểm tra post có tồn tại không
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
        
        // Nếu có parentCommentId, kiểm tra parent comment có tồn tại không
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment || parentComment.isDeleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent comment not found'
                });
            }
            
            // Cập nhật replyCount của parent comment
            await Comment.findByIdAndUpdate(parentCommentId, { 
                $inc: { replyCount: 1 } 
            });
        }
        
        const comment = new Comment({
            postId: id,
            userId: req.userId,
            content: content.trim(),
            parentCommentId: parentCommentId || null,
            image: image || ''
        });
        
        await comment.save();
        await comment.populate('userId', 'username displayName avatar isVerified');
        
        // Send notifications
        const notificationHelper = getNotificationHelper();
        if (notificationHelper) {
            if (parentCommentId) {
                // Reply notification to parent comment author
                const parentComment = await Comment.findById(parentCommentId);
                if (parentComment && parentComment.userId !== req.userId) {
                    await notificationHelper.handleReply(
                        id,
                        parentComment.userId,
                        req.userId,
                        comment._id,
                        parentCommentId
                    );
                }
            } else {
                // Comment notification to post author
                if (post.author && post.author.toString() !== req.userId) {
                    await notificationHelper.handleComment(
                        id,
                        post.author.toString(),
                        req.userId,
                        comment._id
                    );
                }
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: comment
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy tổng số comment + reply của post
exports.getCommentCount = async (req, res) => {
    try {
        const { id } = req.params; // postId
        
        // Kiểm tra post có tồn tại không
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
        
        // Đếm tổng comments (bao gồm cả replies)
        const totalComments = await Comment.countDocuments({
            postId: id,
            isDeleted: false
        });
        
        res.json({
            success: true,
            data: {
                postId: id,
                count: totalComments // SỬA: dùng 'count' thay vì 'totalCount' để match với frontend
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy thống kê chi tiết comment + reply
exports.getCommentStats = async (req, res) => {
    try {
        const { id } = req.params; // postId
        
        // Kiểm tra post có tồn tại không
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
        
        // Đếm comments chính (không có parent)
        const mainComments = await Comment.countDocuments({
            postId: id,
            parentCommentId: null,
            isDeleted: false
        });
        
        // Đếm tất cả replies
        const totalReplies = await Comment.countDocuments({
            postId: id,
            parentCommentId: { $ne: null },
            isDeleted: false
        });
        
        // Tổng số
        const totalCount = mainComments + totalReplies;
        
        // Lấy thêm thống kê likes (SỬA: thêm try-catch để tránh lỗi)
        let totalCommentLikes = 0;
        try {
            const commentLikes = await Comment.aggregate([
                {
                    $match: {
                        postId: new mongoose.Types.ObjectId(id),
                        isDeleted: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalLikes: { $sum: '$likeCount' }
                    }
                }
            ]);
            totalCommentLikes = commentLikes[0]?.totalLikes || 0;
        } catch (aggregateError) {
            // Không làm fail request, chỉ set về 0
        }
        
        res.json({
            success: true,
            data: {
                postId: id,
                totalCount,
                mainComments,
                totalReplies,
                totalCommentLikes
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