const User = require('../models/User');
const Follow = require('../models/Follow');
const { createResponse } = require('../utils/helpers');

// Follow/Unfollow user với Socket.IO
exports.followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId; // ✅ Dùng req.userId từ authMiddleware
        
        console.log('🔄 Follow request:', { currentUserId, targetUserId: userId });
        
        if (userId === currentUserId) {
            return res.status(400).json(
                createResponse(false, 'Cannot follow yourself', null, null, 400)
            );
        }
        
        // Kiểm tra target user có tồn tại không
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        // Kiểm tra đã follow chưa
        const existingFollow = await Follow.findOne({
            follower: currentUserId,
            following: userId
        });
        
        let isFollowing;
        let followerCount;
        let followingCount;
        
        if (existingFollow) {
            // Unfollow
            await Follow.deleteOne({ _id: existingFollow._id });
            
            // Cập nhật counter
            await Promise.all([
                User.findByIdAndUpdate(userId, { $inc: { followerCount: -1 } }),
                User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } })
            ]);
            
            isFollowing = false;
            console.log('✅ Unfollowed successfully');
        } else {
            // Follow
            await Follow.create({
                follower: currentUserId,
                following: userId
            });
            
            // Cập nhật counter
            await Promise.all([
                User.findByIdAndUpdate(userId, { $inc: { followerCount: 1 } }),
                User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } })
            ]);
            
            isFollowing = true;
            console.log('✅ Followed successfully');
        }
        
        // Lấy số lượng mới nhất
        const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
            User.findById(userId).select('followerCount'),
            User.findById(currentUserId).select('followingCount')
        ]);
        
        followerCount = updatedTargetUser.followerCount;
        followingCount = updatedCurrentUser.followingCount;
        
        // ✅ THÊM: Emit Socket.IO events
        if (global.socketServer) {
            const followData = {
                followerId: currentUserId,
                followingId: userId,
                isFollowing,
                followerCount,
                followingCount,
                timestamp: new Date().toISOString()
            };
            
            // Notify target user about new follower/unfollower
            global.socketServer.emitToUser(userId, 'user:follow:update', {
                ...followData,
                type: isFollowing ? 'new_follower' : 'unfollower'
            });
            
            // Notify current user about follow status change
            global.socketServer.emitToUser(currentUserId, 'user:follow:update', {
                ...followData,
                type: isFollowing ? 'following' : 'unfollowing'
            });
            
            // Broadcast to activity feeds
            global.socketServer.io.to(`user:${userId}:activity`).emit('user:follow:activity', followData);
            global.socketServer.io.to(`user:${currentUserId}:activity`).emit('user:follow:activity', followData);
            
            console.log('📡 Follow event broadcasted via Socket.IO');
        }
        
        res.json(createResponse(true, 
            isFollowing ? 'Followed successfully' : 'Unfollowed successfully', 
            {
                isFollowing,
                followerCount,
                followingCount,
                targetUserId: userId
            }
        ));
        
    } catch (error) {
        console.error('❌ Follow error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Lấy danh sách người user đang follow
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        console.log('📥 Fetching following for:', userId);
        
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        
        // Lấy tổng số following
        const total = await Follow.countDocuments({ follower: userId });
        console.log('✅ Total following:', total);
        
        // Lấy danh sách follows với populate
        const follows = await Follow.find({ follower: userId })
            .populate('following', 'username displayName avatar bio followerCount followingCount')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean();
        
        console.log('✅ Follow documents found:', follows.length);
        
        if (follows.length === 0) {
            return res.json(createResponse(true, 'Not following anyone', []));
        }
        
        // Format response
        const following = follows.map(follow => {
            if (!follow.following) {
                console.warn('⚠️ User not found for following:', follow.following);
                return null;
            }
            return {
                _id: follow.following._id,
                username: follow.following.username,
                displayName: follow.following.displayName,
                avatar: follow.following.avatar,
                bio: follow.following.bio,
                followerCount: follow.following.followerCount,
                followingCount: follow.following.followingCount,
                isFollowing: true,
                followedAt: follow.createdAt
            };
        }).filter(Boolean);
        
        const totalPages = Math.ceil(total / limitNum);
        
        console.log('✅ Sending following response');
        
        res.json(createResponse(true, 'Following list retrieved successfully', following, null, null, {
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }));
        
    } catch (error) {
        console.error('❌ Get following error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error: ' + error.message, null, null, 500)
        );
    }
};

// Lấy danh sách followers
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const currentUserId = req.userId; // Để check isFollowing
        
        console.log('📥 Fetching followers for:', userId);
        
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        
        // Lấy tổng số followers
        const total = await Follow.countDocuments({ following: userId });
        console.log('✅ Total followers:', total);
        
        // Lấy danh sách follows với populate
        const follows = await Follow.find({ following: userId })
            .populate('follower', 'username displayName avatar bio followerCount followingCount')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean();
        
        console.log('✅ Follow documents found:', follows.length);
        
        if (follows.length === 0) {
            return res.json(createResponse(true, 'No followers', []));
        }
        
        // Check if current user is following each follower
        const followerIds = follows.map(follow => follow.follower._id);
        const currentUserFollows = currentUserId ? await Follow.find({
            follower: currentUserId,
            following: { $in: followerIds }
        }).lean() : [];
        
        const followingMap = new Set(currentUserFollows.map(f => f.following.toString()));
        
        // Format response
        const followers = follows.map(follow => {
            if (!follow.follower) {
                console.warn('⚠️ User not found for follower:', follow.follower);
                return null;
            }
            return {
                _id: follow.follower._id,
                username: follow.follower.username,
                displayName: follow.follower.displayName,
                avatar: follow.follower.avatar,
                bio: follow.follower.bio,
                followerCount: follow.follower.followerCount,
                followingCount: follow.follower.followingCount,
                isFollowing: followingMap.has(follow.follower._id.toString()),
                followedAt: follow.createdAt
            };
        }).filter(Boolean);
        
        const totalPages = Math.ceil(total / limitNum);
        
        console.log('✅ Sending followers response');
        
        res.json(createResponse(true, 'Followers list retrieved successfully', followers, null, null, {
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }));
        
    } catch (error) {
        console.error('❌ Get followers error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error: ' + error.message, null, null, 500)
        );
    }
};

// Check if user is following another user
exports.checkFollowStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;
        
        if (!currentUserId) {
            return res.json(createResponse(true, 'Not authenticated', { isFollowing: false }));
        }
        
        if (userId === currentUserId) {
            return res.json(createResponse(true, 'Same user', { isFollowing: false }));
        }
        
        const isFollowing = await Follow.exists({
            follower: currentUserId,
            following: userId
        });
        
        res.json(createResponse(true, 'Follow status retrieved', { 
            isFollowing: !!isFollowing 
        }));
        
    } catch (error) {
        console.error('❌ Check follow status error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};
