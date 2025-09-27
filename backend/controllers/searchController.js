const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { createResponse } = require('../utils/helpers');

// Unified search - tìm kiếm cả users và posts
exports.unifiedSearch = async (req, res) => {
    try {
        const { 
            q: query, 
            type = 'all', // 'users', 'posts', 'all'
            page = 1, 
            limit = 10, 
            sort = 'relevance'
        } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json(
                createResponse(false, 'Search query is required', null, null, 400)
            );
        }

        const results = {
            users: [],
            posts: [],
            total: 0
        };

        const searchRegex = new RegExp(query.trim(), 'i');
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Search Users
        if (type === 'all' || type === 'users') {
            const userQuery = {
                $or: [
                    { username: searchRegex },
                    { displayName: searchRegex }
                ]
            };

            const users = await User.find(userQuery)
                .select('-email -__v')
                .sort({ followerCount: -1, createdAt: -1 })
                .limit(type === 'users' ? limitNum : Math.min(limitNum, 5))
                .skip(type === 'users' ? (pageNum - 1) * limitNum : 0)
                .lean();

            results.users = users;
        }

        // Search Posts
        if (type === 'all' || type === 'posts') {
            const postQuery = { 
                isDeleted: false, 
                visibility: 'public',
                $or: [
                    { content: searchRegex },
                    { hashtags: { $in: [query.trim().toLowerCase()] } }
                ]
            };

            let sortOption = { createdAt: -1 };
            switch (sort) {
                case 'relevance':
                    sortOption = { engagementScore: -1, createdAt: -1 };
                    break;
                case 'latest':
                    sortOption = { createdAt: -1 };
                    break;
                case 'popular':
                    sortOption = { likeCount: -1, createdAt: -1 };
                    break;
            }

            const posts = await Post.find(postQuery)
                .populate('userId', 'username displayName avatar isVerified')
                .populate('originalPost')
                .sort(sortOption)
                .limit(type === 'posts' ? limitNum : Math.min(limitNum, 5))
                .skip(type === 'posts' ? (pageNum - 1) * limitNum : 0)
                .lean();

            // Add comment count and like status
            for (let post of posts) {
                if (post.commentCount === undefined) {
                    post.commentCount = await Comment.countDocuments({
                        postId: post._id,
                        isDeleted: false
                    });
                }
            }

            if (req.userId) {
                posts.forEach(post => {
                    post.isLiked = post.likes.some(like => like.userId === req.userId);
                });
            }

            results.posts = posts;
        }

        // Calculate totals for pagination
        if (type === 'users') {
            results.total = await User.countDocuments({
                $or: [
                    { username: searchRegex },
                    { displayName: searchRegex }
                ]
            });
        } else if (type === 'posts') {
            results.total = await Post.countDocuments({ 
                isDeleted: false, 
                visibility: 'public',
                $or: [
                    { content: searchRegex },
                    { hashtags: { $in: [query.trim().toLowerCase()] } }
                ]
            });
        } else {
            results.total = results.users.length + results.posts.length;
        }

        res.json(createResponse(true, 'Search completed successfully', results, null, null, {
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: results.total,
                pages: Math.ceil(results.total / limitNum),
                hasNext: pageNum < Math.ceil(results.total / limitNum),
                hasPrev: pageNum > 1
            },
            searchQuery: query,
            searchType: type,
            sort
        }));

    } catch (error) {
        console.error('Unified search error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Search posts only
exports.searchPosts = async (req, res) => {
    try {
        const { 
            q: query, 
            page = 1, 
            limit = 10, 
            sort = 'relevance',
            dateFrom,
            dateTo,
            hasMedia,
            hashtag
        } = req.query;

        if (!query && !hashtag) {
            return res.status(400).json(
                createResponse(false, 'Search query or hashtag is required', null, null, 400)
            );
        }

        let searchQuery = { 
            isDeleted: false, 
            visibility: 'public' 
        };

        // Text search
        if (query) {
            const searchRegex = new RegExp(query.trim(), 'i');
            searchQuery.$or = [
                { content: searchRegex },
                { hashtags: { $in: [query.trim().toLowerCase()] } }
            ];
        }

        // Hashtag search
        if (hashtag) {
            searchQuery.hashtags = { $in: [hashtag.toLowerCase()] };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            searchQuery.createdAt = {};
            if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
            if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
        }

        // Media filter
        if (hasMedia === 'true') {
            searchQuery.$or = [
                { images: { $exists: true, $ne: [] } },
                { video: { $exists: true, $ne: '' } }
            ];
        } else if (hasMedia === 'false') {
            searchQuery.images = { $size: 0 };
            searchQuery.video = { $in: ['', null] };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        switch (sort) {
            case 'relevance':
                sortOption = { engagementScore: -1, createdAt: -1 };
                break;
            case 'latest':
                sortOption = { createdAt: -1 };
                break;
            case 'popular':
                sortOption = { likeCount: -1, createdAt: -1 };
                break;
            case 'engagement':
                sortOption = { engagementScore: -1, createdAt: -1 };
                break;
        }

        const posts = await Post.find(searchQuery)
            .populate('userId', 'username displayName avatar isVerified')
            .populate('originalPost')
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Add comment count and like status
        for (let post of posts) {
            if (post.commentCount === undefined) {
                post.commentCount = await Comment.countDocuments({
                    postId: post._id,
                    isDeleted: false
                });
            }
        }

        if (req.userId) {
            posts.forEach(post => {
                post.isLiked = post.likes.some(like => like.userId === req.userId);
            });
        }

        const total = await Post.countDocuments(searchQuery);

        res.json(createResponse(true, 'Posts search completed', posts, null, null, {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            searchQuery: query || hashtag,
            filters: {
                dateFrom,
                dateTo,
                hasMedia,
                hashtag,
                sort
            }
        }));

    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Get search suggestions
exports.getSearchSuggestions = async (req, res) => {
    try {
        const { q: query, limit = 5 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.json(createResponse(true, 'Suggestions retrieved', {
                users: [],
                hashtags: [],
                recent: []
            }));
        }

        const searchRegex = new RegExp(query.trim(), 'i');
        const limitNum = parseInt(limit);

        // Get user suggestions
        const userSuggestions = await User.find({
            $or: [
                { username: searchRegex },
                { displayName: searchRegex }
            ]
        })
        .select('username displayName avatar')
        .sort({ followerCount: -1 })
        .limit(limitNum)
        .lean();

        // Get hashtag suggestions from recent posts
        const hashtagSuggestions = await Post.aggregate([
            {
                $match: {
                    hashtags: { $regex: query.trim(), $options: 'i' },
                    isDeleted: false,
                    visibility: 'public',
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            },
            { $unwind: '$hashtags' },
            {
                $match: {
                    hashtags: { $regex: query.trim(), $options: 'i' }
                }
            },
            {
                $group: {
                    _id: '$hashtags',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limitNum }
        ]);

        res.json(createResponse(true, 'Suggestions retrieved successfully', {
            users: userSuggestions,
            hashtags: hashtagSuggestions.map(h => ({ tag: h._id, count: h.count })),
            recent: [] // TODO: Implement recent searches from user history
        }));

    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Get trending hashtags
exports.getTrendingHashtags = async (req, res) => {
    try {
        const { limit = 10, period = 7 } = req.query;
        const limitNum = parseInt(limit);
        const periodDays = parseInt(period);

        const trending = await Post.aggregate([
            {
                $match: {
                    isDeleted: false,
                    visibility: 'public',
                    hashtags: { $exists: true, $ne: [] },
                    createdAt: { $gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) }
                }
            },
            { $unwind: '$hashtags' },
            {
                $group: {
                    _id: '$hashtags',
                    count: { $sum: 1 },
                    engagementSum: { $sum: '$engagementScore' },
                    avgEngagement: { $avg: '$engagementScore' }
                }
            },
            {
                $addFields: {
                    trendingScore: { $multiply: ['$count', '$avgEngagement'] }
                }
            },
            { $sort: { trendingScore: -1, count: -1 } },
            { $limit: limitNum }
        ]);

        res.json(createResponse(true, 'Trending hashtags retrieved successfully', 
            trending.map(t => ({
                hashtag: t._id,
                count: t.count,
                avgEngagement: Math.round(t.avgEngagement || 0),
                trendingScore: Math.round(t.trendingScore || 0)
            }))
        ));

    } catch (error) {
        console.error('Get trending hashtags error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};
