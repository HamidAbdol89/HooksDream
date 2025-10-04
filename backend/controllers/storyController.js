const Story = require('../models/Story');
const User = require('../models/User');
const Follow = require('../models/Follow');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { body, validationResult } = require('express-validator');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB for videos
    },
    fileFilter: (req, file, cb) => {
        // Allow images, videos, and audio
        if (file.mimetype.startsWith('image/') || 
            file.mimetype.startsWith('video/') || 
            file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image, video, and audio files are allowed'), false);
        }
    }
});

// 🎨 Create Story with innovative features
const createStory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.userId;
        const {
            content,
            mediaType,
            visualEffects,
            settings,
            position
        } = req.body;

        let mediaData = null;
        
        // Handle media upload
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: 'hooksdream/stories',
                        transformation: mediaType === 'video' ? [
                            { quality: 'auto:good' },
                            { format: 'mp4' },
                            { duration: '60' } // Max 60 seconds
                        ] : [
                            { quality: 'auto:good' },
                            { format: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });

            mediaData = {
                type: mediaType,
                url: uploadResult.secure_url,
                thumbnail: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
                duration: uploadResult.duration || null,
                dimensions: {
                    width: uploadResult.width,
                    height: uploadResult.height
                }
            };
        } else if (mediaType === 'text') {
            mediaData = {
                type: 'text',
                url: null,
                thumbnail: null,
                duration: null,
                dimensions: null
            };
        }

        // Generate better distributed position for multiple bubbles
        const storyPosition = position || {
            x: 20 + Math.random() * 60, // Keep bubbles more centered (20-80%)
            y: 20 + Math.random() * 60, // Keep bubbles more centered (20-80%)
            z: Math.random() * 10,
            velocity: {
                x: (Math.random() - 0.5) * 1, // Reduced initial velocity
                y: (Math.random() - 0.5) * 1
            },
            scale: 0.9 + Math.random() * 0.2 // Smaller scale range (0.9-1.1)
        };

        // Parse visual effects
        const parsedVisualEffects = visualEffects ? JSON.parse(visualEffects) : {
            bubbleStyle: 'glass',
            colorTheme: {
                primary: '#3B82F6',
                secondary: '#8B5CF6',
                accent: '#F59E0B'
            },
            animation: 'float',
            particles: {
                enabled: false,
                type: 'sparkles',
                intensity: 5
            }
        };

        // Parse settings
        const parsedSettings = settings ? JSON.parse(settings) : {
            visibility: 'followers',
            allowReplies: true,
            allowReactions: true
        };

        // Create story
        const story = new Story({
            userId,
            content: content || '',
            media: mediaData,
            visualEffects: parsedVisualEffects,
            position: storyPosition,
            settings: parsedSettings
        });

        await story.save();

        // Populate user data
        await story.populate('userId', 'username displayName avatar isVerified');

        // Emit to Socket.IO for real-time updates
        if (socketServer) {
            socketServer.io.emit('story:created', {
                story: story,
                userId: userId
            });
        }

        res.status(201).json({
            success: true,
            message: 'Story created successfully',
            data: story
        });

    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create story',
            error: error.message
        });
    }
};

// 🌍 Get Active Stories with 3D positioning
const getActiveStories = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, centerX, centerY, radius = 30 } = req.query;

        let stories;

        if (centerX !== undefined && centerY !== undefined) {
            // Get stories by proximity for bubble positioning
            stories = await Story.getStoriesByProximity(
                parseFloat(centerX),
                parseFloat(centerY),
                parseFloat(radius)
            );
        } else {
            // Get all active stories
            stories = await Story.find({
                isDeleted: false,
                isArchived: false, // Exclude archived stories
                expiresAt: { $gt: new Date() }
            })
            .populate('userId', 'username displayName avatar isVerified')
            .populate('replies.userId', 'username displayName avatar')
            .populate('reactions.userId', 'username displayName avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        }

        // Filter stories based on privacy settings
        const filteredStories = [];
        
        for (const story of stories) {
            if (await canUserViewStory(story, userId)) {
                // Add view status
                const hasViewed = story.views.some(view => view.userId === userId);
                const storyObj = story.toObject();
                storyObj.hasViewed = hasViewed;
                storyObj.isOwn = story.userId._id === userId || story.userId.toString() === userId;
                filteredStories.push(storyObj);
            }
        }

        res.json({
            success: true,
            data: filteredStories,
            count: filteredStories.length
        });

    } catch (error) {
        console.error('Get active stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stories',
            error: error.message
        });
    }
};

// 👁️ View Story (with duration tracking)
const viewStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { duration = 0 } = req.body;
        const userId = req.userId;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user can view story
        if (!(await canUserViewStory(story, userId))) {
            return res.status(403).json({
                success: false,
                message: 'You cannot view this story'
            });
        }

        // Add view
        await story.addView(userId, duration);

        // Emit view event for real-time analytics
        if (socketServer) {
            socketServer.io.to(story.userId).emit('story:viewed', {
                storyId: story._id,
                viewerId: userId,
                duration: duration
            });
        }

        res.json({
            success: true,
            message: 'Story viewed',
            data: {
                viewCount: story.viewCount,
                hasViewed: true
            }
        });

    } catch (error) {
        console.error('View story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to view story',
            error: error.message
        });
    }
};

// 🎭 Add Reaction to Story
const addReaction = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { type, position = { x: 50, y: 50 } } = req.body;
        const userId = req.userId;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if reactions are allowed
        if (!story.settings.allowReactions) {
            return res.status(403).json({
                success: false,
                message: 'Reactions are not allowed on this story'
            });
        }

        // Add reaction
        await story.addReaction(userId, type, position);

        // Populate user data for the reaction
        await story.populate('reactions.userId', 'username displayName avatar');

        // Emit reaction event
        if (socketServer) {
            socketServer.io.to(story.userId).emit('story:reaction', {
                storyId: story._id,
                reaction: {
                    userId: userId,
                    type: type,
                    position: position
                }
            });
        }

        res.json({
            success: true,
            message: 'Reaction added',
            data: {
                reactions: story.reactions,
                reactionCount: story.reactions.length
            }
        });

    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add reaction',
            error: error.message
        });
    }
};

// 💬 Reply to Story (DM)
const replyToStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { message } = req.body;
        const userId = req.userId;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if replies are allowed
        if (!story.settings.allowReplies) {
            return res.status(403).json({
                success: false,
                message: 'Replies are not allowed on this story'
            });
        }

        // Handle media upload if present
        let mediaData = null;
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: 'hooksdream/story-replies'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });

            mediaData = {
                url: uploadResult.secure_url,
                type: uploadResult.resource_type
            };
        }

        // Add reply
        await story.addReply(userId, message, mediaData);

        // Populate the updated story with user info
        await story.populate('replies.userId', 'username displayName avatar');
        
        // Get the latest reply with populated user data
        const latestReply = story.replies[story.replies.length - 1];

        // Emit reply event with populated user data
        if (socketServer) {
            socketServer.io.emit('story:reply', {
                storyId: story._id,
                reply: latestReply
            });
        }

        res.json({
            success: true,
            message: 'Reply sent',
            data: {
                replyCount: story.replies.length,
                reply: latestReply
            }
        });

    } catch (error) {
        console.error('Reply to story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message
        });
    }
};

// ⭐ Highlight Story
const highlightStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { category = 'General' } = req.body;
        const userId = req.userId;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Only story owner can highlight
        if (story.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only highlight your own stories'
            });
        }

        await story.highlightStory(category);

        res.json({
            success: true,
            message: 'Story highlighted',
            data: story
        });

    } catch (error) {
        console.error('Highlight story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to highlight story',
            error: error.message
        });
    }
};

// 🗑️ Delete Story
const deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.userId;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Only story owner can delete
        if (story.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own stories'
            });
        }

        // Soft delete
        story.isDeleted = true;
        story.deletedAt = new Date();
        await story.save();

        // Emit delete event
        if (socketServer) {
            socketServer.io.emit('story:deleted', {
                storyId: story._id,
                userId: userId
            });
        }

        res.json({
            success: true,
            message: 'Story deleted'
        });

    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete story',
            error: error.message
        });
    }
};

// 🎯 Get User's Story Highlights
const getUserHighlights = async (req, res) => {
    try {
        const { userId } = req.params;

        const highlights = await Story.getUserHighlights(userId);

        // Group by category
        const groupedHighlights = highlights.reduce((acc, story) => {
            const category = story.highlightCategory || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(story);
            return acc;
        }, {});

        res.json({
            success: true,
            data: groupedHighlights
        });

    } catch (error) {
        console.error('Get user highlights error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get highlights',
            error: error.message
        });
    }
};

// 🔄 Update Story Position (for physics simulation)
const updateStoryPosition = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { position } = req.body;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        await story.updatePosition(position);

        // Emit position update for real-time physics
        if (socketServer) {
            socketServer.io.emit('story:position_update', {
                storyId: story._id,
                position: story.position
            });
        }

        res.json({
            success: true,
            message: 'Position updated',
            data: {
                position: story.position
            }
        });

    } catch (error) {
        console.error('Update story position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update position',
            error: error.message
        });
    }
};

// Helper function to check if user can view story
const canUserViewStory = async (story, viewerUserId) => {
    // Story owner can always view
    if (story.userId._id === viewerUserId || story.userId.toString() === viewerUserId) {
        return true;
    }
    
    // Check visibility settings
    switch (story.settings.visibility) {
        case 'public':
            return true;
        case 'private':
            return false;
        case 'close_friends':
            return story.settings.closeFriends.includes(viewerUserId);
        case 'followers':
            // Check if viewer follows the story owner
            const follow = await Follow.findOne({
                follower: viewerUserId,
                following: story.userId._id || story.userId
            });
            return !!follow;
        default:
            return false;
    }
};

// Validation rules
const createStoryValidation = [
    body('content').optional().isLength({ max: 500 }).withMessage('Content must be less than 500 characters'),
    body('mediaType').isIn(['image', 'video', 'audio', 'text']).withMessage('Invalid media type'),
    body('settings.visibility').optional().isIn(['public', 'followers', 'close_friends', 'private']).withMessage('Invalid visibility setting')
];

const reactionValidation = [
    body('type').isIn(['love', 'laugh', 'wow', 'sad', 'angry', 'fire', 'sparkle', 'heart_eyes']).withMessage('Invalid reaction type'),
    body('position.x').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid X position'),
    body('position.y').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid Y position')
];

const replyValidation = [
    body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
];

// Socket server instance
let socketServer = null;

// Set socket server instance
const setSocketServer = (server) => {
    socketServer = server;
};

// 📁 Get User's Archived Stories
const getUserArchivedStories = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        const requesterId = req.user.id;

        // Only allow users to view their own archived stories
        if (userId !== requesterId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own archived stories'
            });
        }

        const archivedStories = await Story.getUserArchivedStories(userId, parseInt(limit));

        res.json({
            success: true,
            message: 'Archived stories retrieved',
            data: {
                stories: archivedStories,
                total: archivedStories.length
            }
        });

    } catch (error) {
        console.error('Get archived stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get archived stories',
            error: error.message
        });
    }
};

// 🔄 Restore Archived Story
const restoreArchivedStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Only story owner can restore
        if (story.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only restore your own stories'
            });
        }

        // Check if story is archived
        if (!story.isArchived) {
            return res.status(400).json({
                success: false,
                message: 'Story is not archived'
            });
        }

        await story.restoreStory();

        res.json({
            success: true,
            message: 'Story restored successfully',
            data: story
        });

    } catch (error) {
        console.error('Restore story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore story',
            error: error.message
        });
    }
};

// 🗂️ Archive Story Manually
const archiveStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Only story owner can archive
        if (story.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only archive your own stories'
            });
        }

        // Check if story is already archived
        if (story.isArchived) {
            return res.status(400).json({
                success: false,
                message: 'Story is already archived'
            });
        }

        await story.archiveStory();

        res.json({
            success: true,
            message: 'Story archived successfully',
            data: story
        });

    } catch (error) {
        console.error('Archive story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive story',
            error: error.message
        });
    }
};

module.exports = {
    createStory,
    getActiveStories,
    viewStory,
    addReaction,
    replyToStory,
    highlightStory,
    deleteStory,
    getUserHighlights,
    getUserArchivedStories,
    restoreArchivedStory,
    archiveStory,
    updateStoryPosition,
    upload,
    createStoryValidation,
    reactionValidation,
    replyValidation,
    setSocketServer
};
