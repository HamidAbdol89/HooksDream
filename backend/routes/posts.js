const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Import controllers
const uploadController = require('../controllers/uploadController');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController'); // THÊM DÒNG NÀY
const { getCommentCount, getCommentStats } = require('../controllers/commentController');
const likeController = require('../controllers/likeController');

// Upload routes
router.post('/upload-images', authMiddleware, uploadController.uploadImages);
router.post('/upload-image', authMiddleware, uploadController.uploadImage); // Single image upload
router.post('/upload-video', authMiddleware, uploadController.uploadVideo);

// Post routes
router.get('/', optionalAuth, postController.getPosts);
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        // Call original createPost controller
        await postController.createPost(req, res, next);
    } catch (error) {
        next(error);
    }
});
router.get('/:id', optionalAuth, postController.getPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);
router.get('/:id/likes', optionalAuth, postController.getPostLikes);
router.get('/trending', optionalAuth, postController.getTrendingPosts);
router.get('/search', optionalAuth, postController.searchPosts);

// Like routes with Socket.IO
router.post('/:id/like', authMiddleware, async (req, res, next) => {
    try {
        // Call original like controller
        await likeController.toggleLike(req, res, () => {
            // After successful like, emit socket event
            if (global.socketServer && res.locals.likeResult) {
                const { postId, isLiked, likeCount } = res.locals.likeResult;
                global.socketServer.emitToPost(postId, 'post:liked', {
                    postId,
                    userId: req.userId,
                    isLiked,
                    likeCount,
                    timestamp: new Date().toISOString()
                });
                
                // Also emit to global feed
                global.socketServer.io.to('feed:global').emit('post:liked', {
                    postId,
                    userId: req.userId,
                    isLiked,
                    likeCount,
                    timestamp: new Date().toISOString()
                });
            }
        });
    } catch (error) {
        next(error);
    }
});

// Comment routes
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.post('/:id/comments', authMiddleware, commentController.createComment);

// Comment action routes
router.post('/:postId/comments/:commentId/like', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        
        console.log('🔥 Like comment request:', { 
            commentId, 
            userId: req.userId,
            userIdType: typeof req.userId 
        });
        
        const Comment = require('../models/Comment');
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });
        
        if (!comment) {
            console.log('❌ Comment not found:', commentId);
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        console.log('📝 Comment before toggle:', {
            likeCount: comment.likeCount,
            likesArray: comment.likes,
            isCurrentlyLiked: comment.isLikedBy(req.userId)
        });
        
        const isLiked = await comment.toggleLike(req.userId);
        
        console.log('✅ Comment after toggle:', {
            likeCount: comment.likeCount,
            isLiked,
            likesArray: comment.likes
        });

        // Emit real-time update via Socket.IO
        if (global.socketServer) {
            global.socketServer.emitToPost(postId, 'comment:liked', {
                commentId,
                postId,
                userId: req.userId,
                isLiked,
                likeCount: comment.likeCount,
                timestamp: new Date().toISOString()
            });
        }
        
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

router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const Comment = require('../models/Comment');
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        // Check ownership
        if (comment.userId.toString() !== req.userId) {
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

router.put('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content, image } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const Comment = require('../models/Comment');
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        
        // Check ownership
        if (comment.userId.toString() !== req.userId) {
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

router.post('/:postId/comments/:commentId/replies', authMiddleware, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content, image } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const Comment = require('../models/Comment');
        const Post = require('../models/Post');
        
        // Kiểm tra post có tồn tại không
        const post = await Post.findOne({
            _id: postId,
            isDeleted: false
        });
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Kiểm tra parent comment có tồn tại không
        const parentComment = await Comment.findOne({
            _id: commentId,
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
            postId: postId,
            userId: req.userId,
            content: content.trim(),
            parentCommentId: commentId,
            image: image || ''
        });
        
        await reply.save();
        await reply.populate('userId', 'username displayName avatar isVerified');
        
        // Cập nhật replyCount của parent comment
        await Comment.findByIdAndUpdate(commentId, { 
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

// Comment count routes
router.get('/:id/comment-count', optionalAuth, getCommentCount);
router.get('/:id/comment-stats', optionalAuth, getCommentStats);

module.exports = router;