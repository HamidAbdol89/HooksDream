const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Post'
    },
    userId: {
        type: String, // HashId của user
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    // Để hỗ trợ reply comments (nested comments)
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    // Đếm số replies
    replyCount: {
        type: Number,
        default: 0
    },
    // Likes cho comment
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
    // Mentions trong comment
    mentions: [{
        userId: {
            type: String,
            ref: 'User'
        },
        username: String
    }],
    // Ảnh đính kèm trong comment
    image: {
        type: String, // URL của ảnh
        trim: true
    },
    // Trạng thái
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
    // Báo cáo vi phạm
    reportCount: {
        type: Number,
        default: 0
    },
    isHidden: {
        type: Boolean,
        default: false
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
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ isDeleted: 1 });
CommentSchema.index({ likeCount: -1 });
// Virtual để check xem có phải là reply comment không
CommentSchema.virtual('isReply').get(function() {
    return !!this.parentCommentId;
});

// Method để check xem user đã like comment chưa
CommentSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(like => String(like.userId) === String(userId));
};

// Method để like/unlike comment
CommentSchema.methods.toggleLike = async function(userId) {
    const likeIndex = this.likes.findIndex(like => String(like.userId) === String(userId));
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

// Method để extract mentions từ content
CommentSchema.methods.extractMentions = async function() {
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

// Pre-save middleware
CommentSchema.pre('save', async function(next) {
    if (this.isModified('content')) {
        await this.extractMentions();
        
        if (this.isModified() && !this.isNew) {
            this.isEdited = true;
            this.editedAt = new Date();
        }
    }
    
    next();
});

// Post-save middleware để cập nhật comment count trong Post
CommentSchema.post('save', async function() {
    if (this.isNew && !this.isDeleted) {
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(
            this.postId,
            { $inc: { commentCount: 1 } }
        );
        
        // Nếu là reply comment, cập nhật reply count của parent comment
        if (this.parentCommentId) {
            await mongoose.model('Comment').findByIdAndUpdate(
                this.parentCommentId,
                { $inc: { replyCount: 1 } }
            );
        }
    }
});

// Method để soft delete
CommentSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
    
    // Giảm comment count trong Post
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(
        this.postId,
        { $inc: { commentCount: -1 } }
    );
    
    // Nếu là reply comment, giảm reply count của parent comment
    if (this.parentCommentId) {
        await mongoose.model('Comment').findByIdAndUpdate(
            this.parentCommentId,
            { $inc: { replyCount: -1 } }
        );
    }
};

// Static method để lấy comments của một post
CommentSchema.statics.getPostComments = function(postId, page = 1, limit = 20) {
    return this.find({
        postId: postId,
        parentCommentId: null, // Chỉ lấy top-level comments
        isDeleted: false
    })
    .populate('userId', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method để lấy replies của một comment
CommentSchema.statics.getCommentReplies = function(commentId, page = 1, limit = 10) {
    return this.find({
        parentCommentId: commentId,
        isDeleted: false
    })
    .populate('userId', 'username displayName avatar')
    .sort({ createdAt: 1 }) // Replies sắp xếp từ cũ đến mới
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method để đếm tổng comments của post (bao gồm replies)
CommentSchema.statics.getTotalCommentCount = async function(postId) {
    return await this.countDocuments({
        postId: postId,
        isDeleted: false
    });
};

// Trong Comment model, thêm static method:
CommentSchema.statics.getTotalCountForPost = async function(postId) {
    try {
        const count = await this.countDocuments({
            postId: postId,
            isDeleted: false
        });
        return count;
    } catch (error) {
        console.error('Error counting comments:', error);
        return 0;
    }
};

// Method để lấy breakdown chi tiết
CommentSchema.statics.getDetailedCountForPost = async function(postId) {
    try {
        const mainComments = await this.countDocuments({
            postId: postId,
            parentCommentId: null,
            isDeleted: false
        });
        
        const replies = await this.countDocuments({
            postId: postId,
            parentCommentId: { $ne: null },
            isDeleted: false
        });
        
        return {
            mainComments,
            replies,
            total: mainComments + replies
        };
    } catch (error) {
        console.error('Error getting detailed count:', error);
        return {
            mainComments: 0,
            replies: 0,
            total: 0
        };
    }
};

module.exports = mongoose.model('Comment', CommentSchema);