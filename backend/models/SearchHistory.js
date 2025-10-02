const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    query: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    searchType: {
        type: String,
        enum: ['all', 'users', 'posts'],
        default: 'all'
    },
    resultsCount: {
        type: Number,
        default: 0
    },
    // Lưu top results để quick access
    topResults: {
        users: [{
            _id: String,
            username: String,
            displayName: String,
            avatar: String,
            isVerified: Boolean
        }],
        posts: [{
            _id: String,
            content: String,
            userId: {
                _id: String,
                username: String,
                displayName: String,
                avatar: String
            }
        }]
    },
    // Metadata về search
    metadata: {
        userAgent: String,
        ip: String,
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        }
    }
}, {
    timestamps: true // Tự động tạo createdAt, updatedAt
});

// Index để tối ưu query
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ query: 1 });
SearchHistorySchema.index({ createdAt: -1 });

// Compound index cho user's recent searches
SearchHistorySchema.index({ userId: 1, query: 1 }, { unique: false });

// Static method để lấy recent searches của user với top results
SearchHistorySchema.statics.getRecentSearches = async function(userId, limit = 10) {
    return this.aggregate([
        { $match: { userId: userId } },
        { $sort: { createdAt: -1 } },
        { 
            $group: {
                _id: '$query',
                lastSearched: { $max: '$createdAt' },
                searchCount: { $sum: 1 },
                avgResultsCount: { $avg: '$resultsCount' },
                // Lấy topResults từ search gần nhất
                topResults: { $first: '$topResults' }
            }
        },
        { $sort: { lastSearched: -1 } },
        { $limit: limit },
        {
            $project: {
                query: '$_id',
                lastSearched: 1,
                searchCount: 1,
                avgResultsCount: { $round: ['$avgResultsCount', 0] },
                topResults: 1,
                _id: 0
            }
        }
    ]);
};

// Static method để lấy popular searches
SearchHistorySchema.statics.getPopularSearches = async function(limit = 10, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { 
            $match: { 
                createdAt: { $gte: startDate },
                query: { $ne: '' }
            }
        },
        { 
            $group: {
                _id: '$query',
                searchCount: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                avgResultsCount: { $avg: '$resultsCount' },
                lastSearched: { $max: '$createdAt' }
            }
        },
        {
            $addFields: {
                uniqueUsersCount: { $size: '$uniqueUsers' },
                popularityScore: { 
                    $multiply: [
                        '$searchCount', 
                        { $size: '$uniqueUsers' }
                    ]
                }
            }
        },
        { $sort: { popularityScore: -1, searchCount: -1 } },
        { $limit: limit },
        {
            $project: {
                query: '$_id',
                searchCount: 1,
                uniqueUsersCount: 1,
                avgResultsCount: { $round: ['$avgResultsCount', 0] },
                popularityScore: 1,
                lastSearched: 1,
                _id: 0
            }
        }
    ]);
};

// Instance method để check if search is recent
SearchHistorySchema.methods.isRecent = function(hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);
    return this.createdAt >= hoursAgo;
};

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
