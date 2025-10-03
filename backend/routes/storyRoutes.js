const express = require('express');
const router = express.Router();
const {
    createStory,
    getActiveStories,
    viewStory,
    addReaction,
    replyToStory,
    highlightStory,
    deleteStory,
    getUserHighlights,
    updateStoryPosition,
    upload,
    createStoryValidation,
    reactionValidation,
    replyValidation
} = require('../controllers/storyController');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for story creation
const createStoryLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 stories per 15 minutes
    message: {
        success: false,
        message: 'Too many stories created. Please try again later.'
    }
});

// Rate limiting for reactions
const reactionLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Max 30 reactions per minute
    message: {
        success: false,
        message: 'Too many reactions. Please slow down.'
    }
});

// Rate limiting for replies
const replyLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Max 20 replies per 5 minutes
    message: {
        success: false,
        message: 'Too many replies. Please try again later.'
    }
});

// 🎨 Create Story
router.post('/', 
    authMiddleware,
    createStoryLimit,
    upload.single('media'),
    createStoryValidation,
    createStory
);

// 🌍 Get Active Stories (with 3D positioning support)
router.get('/', 
    authMiddleware,
    getActiveStories
);

// 👁️ View Story
router.post('/:storyId/view', 
    authMiddleware,
    viewStory
);

// 🎭 Add Reaction
router.post('/:storyId/reactions', 
    authMiddleware,
    reactionLimit,
    reactionValidation,
    addReaction
);

// 💬 Reply to Story
router.post('/:storyId/replies', 
    authMiddleware,
    replyLimit,
    upload.single('media'),
    replyValidation,
    replyToStory
);

// ⭐ Highlight Story
router.post('/:storyId/highlight', 
    authMiddleware,
    highlightStory
);

// 🗑️ Delete Story
router.delete('/:storyId', 
    authMiddleware,
    deleteStory
);

// 🎯 Get User's Story Highlights
router.get('/highlights/:userId', 
    authMiddleware,
    getUserHighlights
);

// 🔄 Update Story Position (for physics simulation)
router.patch('/:storyId/position', 
    authMiddleware,
    updateStoryPosition
);

// 📊 Get Story Analytics (for story owner)
router.get('/:storyId/analytics', 
    authMiddleware,
    async (req, res) => {
        try {
            const { storyId } = req.params;
            const userId = req.userId;

            const Story = require('../models/Story');
            const story = await Story.findById(storyId)
                .populate('views.userId', 'username displayName avatar')
                .populate('reactions.userId', 'username displayName avatar');

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Only story owner can view analytics
            if (story.userId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view analytics for your own stories'
                });
            }

            // Calculate analytics
            const analytics = {
                viewCount: story.viewCount,
                reactionCount: story.reactions.length,
                replyCount: story.replies.length,
                views: story.views.map(view => ({
                    user: view.userId,
                    viewedAt: view.viewedAt,
                    duration: view.duration
                })),
                reactions: story.reactions.map(reaction => ({
                    user: reaction.userId,
                    type: reaction.type,
                    position: reaction.position,
                    createdAt: reaction.createdAt
                })),
                // Engagement metrics
                averageViewDuration: story.views.length > 0 
                    ? story.views.reduce((sum, view) => sum + view.duration, 0) / story.views.length 
                    : 0,
                engagementRate: story.viewCount > 0 
                    ? ((story.reactions.length + story.replies.length) / story.viewCount) * 100 
                    : 0
            };

            res.json({
                success: true,
                data: analytics
            });

        } catch (error) {
            console.error('Get story analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics',
                error: error.message
            });
        }
    }
);

// 🔍 Get Stories by User
router.get('/user/:userId', 
    authMiddleware,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const viewerUserId = req.userId;
            const { includeExpired = false } = req.query;

            const Story = require('../models/Story');
            
            let query = {
                userId: userId,
                isDeleted: false
            };

            // Include expired stories only if requested and viewing own stories
            if (!includeExpired || userId !== viewerUserId) {
                query.expiresAt = { $gt: new Date() };
            }

            const stories = await Story.find(query)
                .populate('userId', 'username displayName avatar isVerified')
                .sort({ createdAt: -1 });

            // Filter based on privacy settings
            const filteredStories = [];
            for (const story of stories) {
                const canView = await require('../controllers/storyController').canUserViewStory || 
                    (story.userId._id === viewerUserId || story.settings.visibility === 'public');
                
                if (canView) {
                    const storyObj = story.toObject();
                    storyObj.hasViewed = story.views.some(view => view.userId === viewerUserId);
                    storyObj.isOwn = story.userId._id === viewerUserId;
                    filteredStories.push(storyObj);
                }
            }

            res.json({
                success: true,
                data: filteredStories,
                count: filteredStories.length
            });

        } catch (error) {
            console.error('Get user stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user stories',
                error: error.message
            });
        }
    }
);

module.exports = router;
