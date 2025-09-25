const Post = require('../models/Post');
const User = require('../models/User');
const { createResponse } = require('../utils/helpers');

// Lấy danh sách posts (public feed)
exports.getPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'latest' } = req.query;
        
        let query = { isDeleted: false, visibility: 'public' };
        let sortOption = { createdAt: -1 };
        
        switch (sort) {
            case 'trending':
                sortOption = { engagementScore: -1, createdAt: -1 };
                break;
            case 'popular':
                sortOption = { likeCount: -1, createdAt: -1 };
                break;
            case 'latest':
            default:
                sortOption = { createdAt: -1 };
                break;
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'username displayName avatar isVerified')
            .populate('originalPost')
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        // ✅ THÊM: Lấy commentCount cho mỗi post
        const Comment = require('../models/Comment');
        for (let post of posts) {
            if (post.commentCount === undefined) {
                post.commentCount = await Comment.countDocuments({
                    postId: post._id,
                    isDeleted: false
                });
            }
        }
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        
        res.json({
            success: true,
            data: posts, // ✅ GIỜ ĐÃ CÓ commentCount
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Get posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Tạo post mới
exports.createPost = async (req, res) => {
    try {
        const { content, images, video, visibility = 'public' } = req.body;

        // Cập nhật validation để hỗ trợ video
        if ((!content || content.trim().length === 0) && 
            (!images || images.length === 0) && 
            (!video || video.trim().length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Content, image or video is required'
            });
        }

        const post = new Post({
            userId: req.userId,
            content: content ? content.trim() : '',
            images: images || [],
            video: video || '',
            visibility
        });

        await post.save();
        await post.populate('userId', 'username displayName avatar isVerified');
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: 1 } });

        // Emit real-time event for new post
        if (global.socketServer) {
            const postData = {
                post: post.toObject(),
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to global feed
            global.socketServer.io.to('feed:global').emit('post:created', postData);
            
            // Broadcast to user's followers
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:created', postData);
            
            console.log('📡 New post broadcasted:', post._id);
        }

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });

    } catch (error) {
        console.error('❌ Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy chi tiết một post
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('userId', 'username displayName avatar isVerified')
        .populate('originalPost');
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Check visibility
        if (post.visibility === 'private' && post.userId._id !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Tăng view count
        await post.incrementView();
        
        // Thêm thông tin user đã like hay chưa
        const postData = post.toObject();
        if (req.userId) {
            postData.isLiked = post.isLikedBy(req.userId);
        }
        
        // ✅ THÊM DÒNG NÀY: Đảm bảo commentCount được trả về
        // Nếu post không có commentCount, tính từ database
        if (postData.commentCount === undefined) {
            const Comment = require('../models/Comment');
            postData.commentCount = await Comment.countDocuments({
                postId: id,
                isDeleted: false
            });
        }
        
        res.json({
            success: true,
            data: postData // ✅ GIỜ ĐÃ CÓ commentCount
        });
        
    } catch (error) {
        console.error('❌ Get post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Cập nhật post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, images, video, visibility } = req.body;
        
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
        
        // Check ownership
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Update fields
        if (content !== undefined) post.content = content.trim();
        if (images !== undefined) post.images = images;
        if (video !== undefined) post.video = video;
        if (visibility !== undefined) post.visibility = visibility;
        
        await post.save();
        await post.populate('userId', 'username displayName avatar isVerified');
        
        res.json({
            success: true,
            message: 'Post updated successfully',
            data: post
        });
        
    } catch (error) {
        console.error('❌ Update post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Xóa post
exports.deletePost = async (req, res) => {
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
        
        // Check ownership
        if (post.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Soft delete
        await post.softDelete();
        
        // Cập nhật post count của user
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: -1 } });
        
        // Emit real-time event for post deletion
        if (global.socketServer) {
            const deleteData = {
                postId: id,
                userId: req.userId,
                timestamp: new Date().toISOString()
            };
            
            // Broadcast to post room, global feed, and user's followers
            global.socketServer.emitToPost(id, 'post:deleted', deleteData);
            global.socketServer.io.to('feed:global').emit('post:deleted', deleteData);
            global.socketServer.io.to(`user:${req.userId}:posts`).emit('post:deleted', deleteData);
            
            console.log('📡 Post deletion broadcasted:', id);
        }
        
        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy posts của một user
exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Kiểm tra user có tồn tại không
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        let query = { 
            userId: userId,
            isDeleted: false
        };
        
        // Nếu không phải chính user đó, chỉ hiển thị public posts
        if (req.userId !== userId) {
            query.visibility = 'public';
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'username displayName avatar isVerified')
            .populate('originalPost')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy danh sách users đã like post
exports.getPostLikes = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
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
        
        // Lấy danh sách user IDs từ likes
        const likeUserIds = post.likes.map(like => like.userId);
        
        if (likeUserIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No likes yet'
            });
        }
        
        // Lấy thông tin users với pagination
        const users = await User.find({
            _id: { $in: likeUserIds }
        })
        .select('username displayName avatar isVerified followerCount followingCount postCount createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
        
        // Thêm thông tin thời gian like và follow status
        const usersWithLikeInfo = users.map(user => {
            const likeInfo = post.likes.find(like => like.userId.toString() === user._id.toString());
            
            return {
                ...user,
                likedAt: likeInfo?.createdAt || new Date(),
                isFollowing: req.userId ? user.followers?.includes(req.userId) : false
            };
        });
        
        res.json({
            success: true,
            data: usersWithLikeInfo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: likeUserIds.length,
                pages: Math.ceil(likeUserIds.length / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Get post likes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Lấy posts trending
exports.getTrendingPosts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const posts = await Post.getTrendingPosts(limit);
        
        // Thêm thông tin user đã like hay chưa
        const postsWithLikeInfo = posts.map(post => {
            const postData = post.toObject();
            if (req.userId) {
                postData.isLiked = post.isLikedBy(req.userId);
            }
            return postData;
        });
        
        res.json({
            success: true,
            data: postsWithLikeInfo
        });
        
    } catch (error) {
        console.error('❌ Get trending posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Share một post
exports.sharePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { shareText } = req.body;
        
        // Kiểm tra post gốc có tồn tại không
        const originalPost = await Post.findOne({
            _id: id,
            isDeleted: false
        });
        
        if (!originalPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Không cho phép share post private
        if (originalPost.visibility === 'private') {
            return res.status(403).json({
                success: false,
                message: 'Cannot share private post'
            });
        }
        
        // Tạo shared post
        const sharedPost = new Post({
            userId: req.userId,
            content: shareText || '',
            originalPost: id,
            shareText: shareText || '',
            visibility: 'public'
        });
        
        await sharedPost.save();
        await sharedPost.populate('userId', 'username displayName avatar isVerified');
        await sharedPost.populate('originalPost');
        
        // Cập nhật share count của post gốc
        originalPost.shareCount += 1;
        await originalPost.save();
        
        // Cập nhật post count của user
        await User.findByIdAndUpdate(req.userId, { $inc: { postCount: 1 } });
        
        res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: sharedPost
        });
        
    } catch (error) {
        console.error('❌ Share post error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Tìm kiếm posts
exports.searchPosts = async (req, res) => {
    try {
        const { q, hashtag, page = 1, limit = 10 } = req.query;
        
        let query = { 
            isDeleted: false,
            visibility: 'public'
        };
        
        if (hashtag) {
            // Tìm kiếm theo hashtag
            query.hashtags = hashtag.toLowerCase().replace('#', '');
        } else if (q) {
            // Tìm kiếm trong content
            query.content = new RegExp(q, 'i');
        } else {
            return res.status(400).json({
                success: false,
                message: 'Search query or hashtag is required'
            });
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'username displayName avatar isVerified')
            .populate('originalPost')
            .sort({ engagementScore: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        // Thêm thông tin user đã like hay chưa
        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }
        
        const total = await Post.countDocuments(query);
        
        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            searchQuery: q || hashtag
        });
        
    } catch (error) {
        console.error('❌ Search posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};