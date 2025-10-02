// backend/controllers/friendDiscoveryController.js - Enhanced Friend Discovery System
const mongoose = require('mongoose');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Enhanced Friend Discovery Controller
 * Implements ML-like recommendation algorithms for social discovery
 */

// Get recommended users based on ML-like algorithms
const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { limit = 10 } = req.query;

    // Get current user's following and followers for analysis
    const currentUserFollows = await Follow.find({ follower: currentUserId }).select('following');
    const currentUserFollowers = await Follow.find({ following: currentUserId }).select('follower');
    
    const followingIds = currentUserFollows.map(f => f.following.toString());
    const followerIds = currentUserFollowers.map(f => f.follower.toString());

    // Algorithm 1: Mutual Connections (Friends of Friends)
    const mutualConnections = await Follow.aggregate([
      {
        $match: {
          follower: { $in: followingIds },
          following: { $nin: [currentUserId, ...followingIds] }
        }
      },
      {
        $group: {
          _id: '$following',
          mutualCount: { $sum: 1 },
          mutualFriends: { $push: '$follower' }
        }
      },
      { $sort: { mutualCount: -1 } },
      { $limit: parseInt(limit) * 2 }
    ]);

    // Algorithm 2: Interest-based recommendations (users who liked similar posts)
    const userLikedPosts = await Post.find({ 
      'likes.userId': currentUserId 
    }).select('_id').limit(50);
    const likedPostIds = userLikedPosts.map(post => post._id);

    const similarInterestUsers = await Post.aggregate([
      {
        $match: {
          _id: { $in: likedPostIds }
        }
      },
      {
        $unwind: '$likes'
      },
      {
        $match: {
          'likes.userId': { $ne: currentUserId }
        }
      },
      {
        $group: {
          _id: '$likes.userId',
          commonLikes: { $sum: 1 }
        }
      },
      { $sort: { commonLikes: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Algorithm 3: Activity-based recommendations (active users in similar time zones)
    const activeUsers = await User.find({
      _id: { $nin: [currentUserId, ...followingIds] },
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
    })
    .sort({ lastLoginAt: -1 })
    .limit(parseInt(limit));

    // Combine and score recommendations
    const recommendationScores = new Map();

    // Score mutual connections (highest weight)
    mutualConnections.forEach(conn => {
      const userId = conn._id.toString();
      recommendationScores.set(userId, {
        userId,
        score: conn.mutualCount * 10, // High weight for mutual connections
        reasons: [`${conn.mutualCount} mutual connections`],
        mutualFollowers: conn.mutualCount
      });
    });

    // Score similar interests (medium weight)
    similarInterestUsers.forEach(user => {
      const userId = user._id.toString();
      const existing = recommendationScores.get(userId) || { userId, score: 0, reasons: [] };
      existing.score += user.commonLikes * 5; // Medium weight for similar interests
      existing.reasons.push(`${user.commonLikes} similar interests`);
      recommendationScores.set(userId, existing);
    });

    // Score active users (low weight)
    activeUsers.forEach(user => {
      const userId = user._id.toString();
      const existing = recommendationScores.get(userId) || { userId, score: 0, reasons: [] };
      existing.score += 2; // Low weight for activity
      existing.reasons.push('Recently active');
      recommendationScores.set(userId, existing);
    });

    // Get top recommendations
    const topRecommendations = Array.from(recommendationScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    // Fetch user details
    const recommendedUserIds = topRecommendations.map(rec => rec.userId);
    const users = await User.find({ _id: { $in: recommendedUserIds } })
      .select('username displayName avatar isVerified followersCount followingCount postsCount bio location joinedAt')
      .lean();

    // Enrich with recommendation metadata
    const enrichedUsers = users.map(user => {
      const recommendation = recommendationScores.get(user._id.toString());
      return {
        ...user,
        mutualFollowers: recommendation?.mutualFollowers || 0,
        recommendationScore: recommendation?.score || 0,
        recommendationReasons: recommendation?.reasons || [],
        isFollowing: false // Will be determined by frontend
      };
    });

    res.json({
      success: true,
      data: enrichedUsers,
      metadata: {
        algorithm: 'ml-based-recommendations',
        totalScored: recommendationScores.size,
        returned: enrichedUsers.length
      }
    });

  } catch (error) {
    console.error('Error getting recommended users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommended users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get nearby users based on location
const getNearbyUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { radius = 50, lat, lng, limit = 15 } = req.query;

    // For now, just return users with location data (since location is stored as string)
    // TODO: Implement proper geospatial indexing with GeoJSON Point
    const nearbyUsers = await User.find({
      _id: { $ne: currentUserId },
      location: { $exists: true, $ne: '', $ne: null }
    })
    .select('username displayName avatar isVerified followersCount followingCount postsCount bio location joinedAt')
    .limit(parseInt(limit))
    .lean();

    // Since we can't do real geospatial queries with string location,
    // we'll just return users with location data
    const enrichedUsers = nearbyUsers.map(user => ({
      ...user,
      approximateDistance: null, // Can't calculate without proper coordinates
      isFollowing: false
    }));

    res.json({
      success: true,
      data: enrichedUsers,
      metadata: {
        searchRadius: radius,
        userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        returned: enrichedUsers.length
      }
    });

  } catch (error) {
    console.error('Error getting nearby users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get new users (recently joined)
const getNewUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { limit = 20, days = 30 } = req.query;

    const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const newUsers = await User.find({
      _id: { $ne: currentUserId },
      createdAt: { $gte: cutoffDate }
    })
    .select('username displayName avatar isVerified followersCount followingCount postsCount bio location joinedAt createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    // Enrich with "days since joined"
    const enrichedUsers = newUsers.map(user => ({
      ...user,
      daysSinceJoined: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
      isFollowing: false
    }));

    res.json({
      success: true,
      data: enrichedUsers,
      metadata: {
        searchPeriod: `${days} days`,
        cutoffDate,
        returned: enrichedUsers.length
      }
    });

  } catch (error) {
    console.error('Error getting new users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get new users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get trending users (high engagement recently)
const getTrendingUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { limit = 15, days = 7 } = req.query;

    const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Calculate engagement scores
    const trendingUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUserId }
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'recentPosts',
          pipeline: [
            { $match: { createdAt: { $gte: cutoffDate } } },
            { $limit: 10 }
          ]
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'recentPosts._id',
          foreignField: 'post',
          as: 'recentComments'
        }
      },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $sum: '$recentPosts.likeCount' }, // Sum of likes from recent posts
              { $multiply: [{ $size: '$recentComments' }, 2] }, // Comments worth 2x likes
              { $multiply: [{ $size: '$recentPosts' }, 3] } // Posts worth 3x likes
            ]
          }
        }
      },
      {
        $match: {
          engagementScore: { $gt: 0 }
        }
      },
      {
        $sort: { engagementScore: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          username: 1,
          displayName: 1,
          avatar: 1,
          isVerified: 1,
          followersCount: 1,
          followingCount: 1,
          postsCount: 1,
          bio: 1,
          location: 1,
          joinedAt: 1,
          engagementScore: 1,
          recentPostsCount: { $size: '$recentPosts' }
        }
      }
    ]);

    const enrichedUsers = trendingUsers.map(user => ({
      ...user,
      isFollowing: false,
      trendingReason: `${user.engagementScore} engagement points in last ${days} days`
    }));

    res.json({
      success: true,
      data: enrichedUsers,
      metadata: {
        searchPeriod: `${days} days`,
        cutoffDate,
        returned: enrichedUsers.length,
        algorithm: 'engagement-based-trending'
      }
    });

  } catch (error) {
    console.error('Error getting trending users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Utility function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 10) / 10; // Round to 1 decimal place
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

module.exports = {
  getRecommendedUsers,
  getNearbyUsers,
  getNewUsers,
  getTrendingUsers
};
