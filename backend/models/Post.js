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
    // Công thức đơn giản: likes * 2 + comments * 3 + shares * 5
    this.engagementScore = (this.likeCount * 2) + (this.commentCount * 3) + (this.shareCount * 5);
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

// Pre-save middleware để tự động extract hashtags và mentions
PostSchema.pre('save', async function(next) {
    if (this.isModified('content')) {
        this.extractHashtags();
        await this.extractMentions();
        
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

// Static method để lấy posts công khai
PostSchema.statics.getPublicPosts = function(page = 1, limit = 10) {
    return this.find({ 
        isDeleted: false,
        visibility: 'public'
    })
    .populate('userId', 'username displayName avatar')
    .populate('originalPost')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method để lấy trending posts
PostSchema.statics.getTrendingPosts = function(limit = 10) {
    return this.find({
        isDeleted: false,
        visibility: 'public',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .populate('userId', 'username displayName avatar')
    .sort({ engagementScore: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Post', PostSchema);