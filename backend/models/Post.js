const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    userId: {
        type: String, // HashId của user
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: false,
        maxlength: 5000,
        trim: true
    },
    images: [{
        type: String, // URLs của ảnh
        trim: true
    }],
    video: {
        type: String, // URL của video
        trim: true
    },
    // Link previews cho URLs trong content
    linkPreviews: [{
        url: {
            type: String,
            required: true,
            trim: true
        },
        title: {
            type: String,
            maxlength: 100,
            trim: true
        },
        description: {
            type: String,
            maxlength: 200,
            trim: true
        },
        image: {
            type: String,
            trim: true
        },
        siteName: {
            type: String,
            maxlength: 50,
            trim: true
        },
        type: {
            type: String,
            default: 'website'
        },
        publishedTime: {
            type: String
        },
        author: {
            type: String,
            maxlength: 50,
            trim: true
        },
        favicon: {
            type: String,
            trim: true
        },
        crawledAt: {
            type: Date,
            default: Date.now
        }
    }],
    hashtags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    mentions: [{
        userId: {
            type: String,
            ref: 'User'
        },
        username: String
    }],
    likes: [{
        userId: {
            type: String,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    shareCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    // Cho posts được share từ post khác
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    shareText: {
        type: String,
        maxlength: 500,
        trim: true
    },
    // Repost functionality - trỏ tới post gốc
    repost_of: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    // Đếm số lượng repost
    repostCount: {
        type: Number,
        default: 0
    },
    // Flag để mark khi original post bị xóa
    originalPostDeleted: {
        type: Boolean,
        default: false
    },
    // Archive functionality - soft delete với TTL 30 ngày
    isArchived: {
        type: Boolean,
        default: false,
        index: true // Index cho query performance
    },
    archivedAt: {
        type: Date,
        default: null
    },
    // TTL field - auto delete sau 30 ngày
    expiresAt: {
        type: Date,
        default: null,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    // Privacy settings
    visibility: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public'
    },
    // Engagement metrics
    engagementScore: {
        type: Number,
        default: 0
    },
    // Bot-generated content
    isBot: {
        type: Boolean,
        default: false,
        index: true
    },
    botMetadata: {
        createdBy: {
            type: String, // 'python_bot', 'ai_assistant', etc.
        },
        topic: {
            type: String, // 'nature', 'technology', etc.
        },
        photoData: {
            type: mongoose.Schema.Types.Mixed, // Unsplash photo metadata
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
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

// Indexes for better performance
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ likeCount: -1 });
PostSchema.index({ engagementScore: -1 });
PostSchema.index({ visibility: 1 });
PostSchema.index({ isDeleted: 1 });

// Virtual for post URL
PostSchema.virtual('postUrl').get(function() {
    return `/post/${this._id}`;
});

// Method để check xem user đã like post chưa
PostSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(like => like.userId === userId);
};

// Method để like/unlike post
PostSchema.methods.toggleLike = async function(userId) {
    const likeIndex = this.likes.findIndex(like => like.userId === userId);
    
    if (likeIndex > -1) {
        // Unlike
        this.likes.splice(likeIndex, 1);
        this.likeCount = Math.max(0, this.likeCount - 1);
    } else {
        // Like
        this.likes.push({ userId, createdAt: new Date() });
        this.likeCount += 1;
    }
    
    await this.save();
    return this.isLikedBy(userId);
};

// Method để tăng view count
PostSchema.methods.incrementView = async function() {
    this.viewCount += 1;
    await this.save();
};

// Method để tính engagement score
PostSchema.methods.calculateEngagementScore = function() {
    // Công thức đơn giản: likes * 2 + comments * 3 + shares * 5 + reposts * 4
    this.engagementScore = (this.likeCount * 2) + (this.commentCount * 3) + (this.shareCount * 5) + (this.repostCount * 4);
    return this.engagementScore;
};

// Method để extract hashtags từ content
PostSchema.methods.extractHashtags = function() {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = this.content.match(hashtagRegex);
    
    if (matches) {
        this.hashtags = matches.map(tag => tag.substring(1).toLowerCase());
    }
};

// Method để extract mentions từ content
PostSchema.methods.extractMentions = async function() {
    const mentionRegex = /@(\w+)/g;
    const matches = this.content.match(mentionRegex);
    
    if (matches) {
        const User = mongoose.model('User');
        const mentions = [];
        
        for (const match of matches) {
            const username = match.substring(1);
            const user = await User.findOne({ username: username });
            
            if (user) {
                mentions.push({
                    userId: user._id,
                    username: user.username
                });
            }
        }
        
        this.mentions = mentions;
    }
};

// Method để extract link previews từ content
PostSchema.methods.extractLinkPreviews = async function() {
    if (!this.content) return;
    
    const linkPreviewService = require('../services/linkPreviewService');
    const urls = linkPreviewService.extractUrls(this.content);
    
    if (urls.length > 0) {
        try {
            const previews = await linkPreviewService.getMultiplePreviews(urls);
            this.linkPreviews = previews;
        } catch (error) {
            console.error('Error extracting link previews:', error);
            this.linkPreviews = [];
        }
    } else {
        this.linkPreviews = [];
    }
};

// Pre-save middleware để tự động extract hashtags, mentions và link previews
PostSchema.pre('save', async function(next) {
    if (this.isModified('content')) {
        this.extractHashtags();
        await this.extractMentions();
        await this.extractLinkPreviews();
        
        if (this.isModified() && !this.isNew) {
            this.isEdited = true;
            this.editedAt = new Date();
        }
    }
    
    // Tính lại engagement score
    this.calculateEngagementScore();
    
    next();
});

// Method để soft delete
PostSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
};

// Method để archive post với TTL 30 ngày
PostSchema.methods.archivePost = async function() {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 ngày
    
    this.isArchived = true;
    this.archivedAt = now;
    this.expiresAt = expiryDate;
    await this.save();
};

// Method để restore archived post
PostSchema.methods.restorePost = async function() {
    this.isArchived = false;
    this.archivedAt = null;
    this.expiresAt = null;
    await this.save();
};

// Static method để lấy posts công khai
PostSchema.statics.getPublicPosts = function(page = 1, limit = 10) {
    return this.find({ 
        isDeleted: false,
        $or: [
            { isArchived: false },
            { isArchived: { $exists: false } }
        ],
        visibility: 'public'
    })
    .populate('userId', 'username displayName avatar')
    .populate('originalPost')
    .populate({
        path: 'repost_of',
        populate: {
            path: 'userId',
            select: 'username displayName avatar isVerified'
        }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method để lấy trending posts
PostSchema.statics.getTrendingPosts = function(limit = 10) {
    return this.find({
        isDeleted: false,
        $or: [
            { isArchived: false },
            { isArchived: { $exists: false } }
        ],
        visibility: 'public',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .populate('userId', 'username displayName avatar')
    .sort({ engagementScore: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Post', PostSchema);