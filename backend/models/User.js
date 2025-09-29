// User.js - Cập nhật đầy đủ schema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: { 
        type: String,
        required: true 
    },
    // Google Auth fields
    googleId: {
        type: String,
        unique: true,
        required: true
    },
   email: {
    type: String,
    required: false,  // Đổi thành không bắt buộc
    unique: false,    // Bỏ unique constraint
    sparse: true,     // Cho phép null nhưng vẫn unique nếu có giá trị
    lowercase: true,
    trim: true
},
isSetupComplete: {
    type: Boolean,
    default: true // ✅ Mặc định là true
},
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    avatar: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '',
        maxlength: 160
    },
 location: {
    type: String,
    default: '',
    maxlength: 100
},
  website: {
    type: String,
    default: '',
    validate: {
        validator: function(v) {
            if (!v) return true; // Cho phép empty
            return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
        },
        message: 'Invalid website URL'
    }
},
phone: {
    type: String,
    default: '',
    validate: {
        validator: function(v) {
            if (!v) return true; // Cho phép empty
            return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: 'Invalid phone number format'
    }
},
   pronouns: {
    type: String,
    default: '',
    maxlength: 30
},
    isVerified: {
        type: Boolean,
        default: false
    },
    followerCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    postCount: {
        type: Number,
        default: 0
    },
    
    // Profile customization tracking
    hasCustomDisplayName: {
        type: Boolean,
        default: false
    },
    hasCustomAvatar: {
        type: Boolean,
        default: false
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    
    // Online status tracking
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { 
    _id: false,
    timestamps: true
});

// Indexes - Only add indexes that are not already unique in schema
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isOnline: 1 });
UserSchema.index({ lastSeen: -1 });

// Virtuals
UserSchema.virtual('profileUrl').get(function() {
    return `/profile/${this._id}`;
});

UserSchema.virtual('joinedDate').get(function() {
    return this.createdAt;
});

// Thêm vào User.js sau các virtuals
UserSchema.methods.follow = async function(targetUserId) {
    const Follow = mongoose.model('Follow');
    
    // Kiểm tra đã follow chưa
    const existingFollow = await Follow.findOne({
        follower: this._id,
        following: targetUserId
    });
    
    if (existingFollow) {
        throw new Error('Already following this user');
    }
    
    // Tạo follow relationship
    const follow = new Follow({
        follower: this._id,
        following: targetUserId
    });
    
    await follow.save();
    
    // Update counts
    this.followingCount += 1;
    await this.save();
    
    // Update target user's follower count
    await mongoose.model('User').findByIdAndUpdate(targetUserId, {
        $inc: { followerCount: 1 }
    });
    
    return follow;
};

UserSchema.methods.unfollow = async function(targetUserId) {
    const Follow = mongoose.model('Follow');
    
    const result = await Follow.findOneAndDelete({
        follower: this._id,
        following: targetUserId
    });
    
    if (result) {
        // Update counts
        this.followingCount = Math.max(0, this.followingCount - 1);
        await this.save();
        
        // Update target user's follower count
        await mongoose.model('User').findByIdAndUpdate(targetUserId, {
            $inc: { followerCount: -1 }
        });
    }
    
    return result;
};

UserSchema.methods.isFollowing = async function(targetUserId) {
    const Follow = mongoose.model('Follow');
    return await Follow.exists({
        follower: this._id,
        following: targetUserId
    });
};

// Methods
UserSchema.methods.updateLastLogin = function() {
    this.lastLoginAt = new Date();
    return this.save();
};

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);