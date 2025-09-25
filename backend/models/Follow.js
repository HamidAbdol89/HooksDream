// models/Follow.js
const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    follower: {
        type: String, // userId của người follow
        ref: 'User',
        required: true
    },
    following: {
        type: String, // userId của người được follow
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Đảm bảo mỗi cặp follower-following là duy nhất
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index để tối ưu query
FollowSchema.index({ follower: 1 });
FollowSchema.index({ following: 1 });
FollowSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Follow', FollowSchema);