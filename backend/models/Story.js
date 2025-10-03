const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    userId: {
        type: String, // HashId của user
        required: true,
        ref: 'User',
        index: true
    },
    
    // Story Content
    content: {
        type: String,
        maxlength: 500,
        trim: true
    },
    
    // Media content
    media: {
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'text'],
            required: true
        },
        url: {
            type: String,
            trim: true
        },
        thumbnail: {
            type: String, // For videos
            trim: true
        },
        duration: {
            type: Number, // For videos/audio in seconds
            min: 1,
            max: 60 // Max 60 seconds
        },
        dimensions: {
            width: Number,
            height: Number
        }
    },
    
    // 🎨 INNOVATIVE: Story Visual Effects
    visualEffects: {
        // Bubble appearance
        bubbleStyle: {
            type: String,
            enum: ['glass', 'neon', 'gradient', 'holographic', 'minimal'],
            default: 'glass'
        },
        
        // Color theme
        colorTheme: {
            primary: {
                type: String,
                default: '#3B82F6' // Blue
            },
            secondary: {
                type: String,
                default: '#8B5CF6' // Purple
            },
            accent: {
                type: String,
                default: '#F59E0B' // Amber
            }
        },
        
        // Animation style
        animation: {
            type: String,
            enum: ['float', 'pulse', 'rotate', 'bounce', 'wave'],
            default: 'float'
        },
        
        // Particle effects
        particles: {
            enabled: {
                type: Boolean,
                default: false
            },
            type: {
                type: String,
                enum: ['sparkles', 'bubbles', 'stars', 'hearts', 'fire'],
                default: 'sparkles'
            },
            intensity: {
                type: Number,
                min: 1,
                max: 10,
                default: 5
            }
        }
    },
    
    // 🌍 INNOVATIVE: 3D Positioning
    position: {
        // 3D coordinates for bubble placement
        x: {
            type: Number,
            default: () => Math.random() * 100 // 0-100%
        },
        y: {
            type: Number,
            default: () => Math.random() * 100 // 0-100%
        },
        z: {
            type: Number,
            default: () => Math.random() * 10 // Depth layer 0-10
        },
        
        // Physics properties
        velocity: {
            x: {
                type: Number,
                default: () => (Math.random() - 0.5) * 2 // -1 to 1
            },
            y: {
                type: Number,
                default: () => (Math.random() - 0.5) * 2
            }
        },
        
        // Bubble size (affects physics)
        scale: {
            type: Number,
            min: 0.5,
            max: 2.0,
            default: 1.0
        }
    },
    
    // Story Settings
    settings: {
        // Privacy
        visibility: {
            type: String,
            enum: ['public', 'followers', 'close_friends', 'private'],
            default: 'followers'
        },
        
        // Close friends list (for close_friends visibility)
        closeFriends: [{
            type: String,
            ref: 'User'
        }],
        
        // Allow interactions
        allowReplies: {
            type: Boolean,
            default: true
        },
        
        allowReactions: {
            type: Boolean,
            default: true
        },
        
        // Music/Audio
        backgroundMusic: {
            url: String,
            title: String,
            artist: String,
            startTime: {
                type: Number,
                default: 0
            }
        }
    },
    
    // Engagement
    views: [{
        userId: {
            type: String,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        },
        // View duration in seconds
        duration: {
            type: Number,
            default: 0
        }
    }],
    
    viewCount: {
        type: Number,
        default: 0
    },
    
    // 🎭 INNOVATIVE: Story Reactions (not just likes)
    reactions: [{
        userId: {
            type: String,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['love', 'laugh', 'wow', 'sad', 'angry', 'fire', 'sparkle', 'heart_eyes'],
            required: true
        },
        // 3D position where reaction was placed
        position: {
            x: Number,
            y: Number
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Story Replies (DMs)
    replies: [{
        userId: {
            type: String,
            ref: 'User'
        },
        message: {
            type: String,
            maxlength: 500
        },
        media: {
            type: String, // URL
            mediaType: {
                type: String,
                enum: ['image', 'video', 'audio']
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Story Highlights
    isHighlighted: {
        type: Boolean,
        default: false
    },
    
    highlightCategory: {
        type: String,
        trim: true
    },
    
    // Auto-delete after 24 hours
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    
    // Soft delete for highlights
    isDeleted: {
        type: Boolean,
        default: false
    },
    
    deletedAt: {
        type: Date
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ 'settings.visibility': 1 });
StorySchema.index({ isDeleted: 1 });
StorySchema.index({ isHighlighted: 1 });

// Virtual for story URL
StorySchema.virtual('storyUrl').get(function() {
    return `/story/${this._id}`;
});

// Method to check if user can view story
StorySchema.methods.canUserView = function(viewerUserId) {
    // Story owner can always view
    if (this.userId === viewerUserId) return true;
    
    // Check visibility settings
    switch (this.settings.visibility) {
        case 'public':
            return true;
        case 'private':
            return false;
        case 'close_friends':
            return this.settings.closeFriends.includes(viewerUserId);
        case 'followers':
            // Would need to check if viewer follows the story owner
            // This would require a separate query to Follow model
            return true; // Simplified for now
        default:
            return false;
    }
};

// Method to add view
StorySchema.methods.addView = async function(viewerUserId, duration = 0) {
    // Don't count owner's views
    if (this.userId === viewerUserId) return;
    
    // Check if user already viewed
    const existingView = this.views.find(view => view.userId === viewerUserId);
    
    if (!existingView) {
        this.views.push({
            userId: viewerUserId,
            viewedAt: new Date(),
            duration: duration
        });
        this.viewCount += 1;
        await this.save();
    } else {
        // Update duration if longer
        if (duration > existingView.duration) {
            existingView.duration = duration;
            await this.save();
        }
    }
};

// Method to add reaction
StorySchema.methods.addReaction = async function(userId, reactionType, position = { x: 50, y: 50 }) {
    // Remove existing reaction from same user
    this.reactions = this.reactions.filter(reaction => reaction.userId !== userId);
    
    // Add new reaction
    this.reactions.push({
        userId,
        type: reactionType,
        position,
        createdAt: new Date()
    });
    
    await this.save();
};

// Method to add reply
StorySchema.methods.addReply = async function(userId, message, media = null) {
    this.replies.push({
        userId,
        message,
        media: media?.url,
        mediaType: media?.type,
        createdAt: new Date()
    });
    
    await this.save();
};

// Method to highlight story
StorySchema.methods.highlightStory = async function(category = 'General') {
    this.isHighlighted = true;
    this.highlightCategory = category;
    this.expiresAt = null; // Remove expiration for highlights
    await this.save();
};

// Method to update 3D position (for physics simulation)
StorySchema.methods.updatePosition = async function(newPosition) {
    this.position = { ...this.position, ...newPosition };
    await this.save();
};

// Static method to get active stories for feed
StorySchema.statics.getActiveStories = function(viewerUserId, limit = 50) {
    return this.find({
        isDeleted: false,
        expiresAt: { $gt: new Date() }, // Not expired
        $or: [
            { 'settings.visibility': 'public' },
            { 
                'settings.visibility': 'followers',
                // Would need to join with Follow model to check if viewer follows owner
            },
            {
                'settings.visibility': 'close_friends',
                'settings.closeFriends': viewerUserId
            },
            { userId: viewerUserId } // Own stories
        ]
    })
    .populate('userId', 'username displayName avatar isVerified')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user's story highlights
StorySchema.statics.getUserHighlights = function(userId) {
    return this.find({
        userId: userId,
        isHighlighted: true,
        isDeleted: false
    })
    .sort({ createdAt: -1 });
};

// Static method to get stories by location/proximity (for bubble positioning)
StorySchema.statics.getStoriesByProximity = function(centerX, centerY, radius = 20) {
    return this.find({
        isDeleted: false,
        expiresAt: { $gt: new Date() },
        'position.x': { 
            $gte: centerX - radius, 
            $lte: centerX + radius 
        },
        'position.y': { 
            $gte: centerY - radius, 
            $lte: centerY + radius 
        }
    })
    .populate('userId', 'username displayName avatar')
    .sort({ 'position.z': -1 }); // Front to back
};

// Pre-save middleware
StorySchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Story', StorySchema);
