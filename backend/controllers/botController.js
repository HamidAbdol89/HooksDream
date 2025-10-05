/**
 * Bot Controller
 * Handles automated content creation from Python backend
 */

const Post = require('../models/Post');
const User = require('../models/User');
const { cloudinary } = require('../utils/cloudinary');

// Socket server instance
let socketServer = null;
const setSocketServer = (server) => {
  socketServer = server;
};

/**
 * Create post from Python bot
 * Receives automated posts with Unsplash images
 */
const createBotPost = async (req, res) => {
  try {
    const { content, images, bot_metadata } = req.body;

    if (!content || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content and images are required'
      });
    }

    // Find or create bot user
    const botUserData = bot_metadata?.bot_user;
    if (!botUserData) {
      return res.status(400).json({
        success: false,
        message: 'Bot user metadata is required'
      });
    }

    let botUser = await User.findOne({ username: botUserData.username });
    
    if (!botUser) {
      // Create bot user if doesn't exist
      const crypto = require('crypto');
      const botId = crypto.randomBytes(12).toString('hex'); // Generate unique ID
      
      botUser = new User({
        _id: botId,
        googleId: `bot_${botUserData.username}_${Date.now()}`, // Unique googleId for bot
        username: botUserData.username,
        displayName: botUserData.name,
        email: `${botUserData.username}@hooksdream.bot`,
        bio: botUserData.bio || 'Automated content creator',
        isBot: true,
        isVerified: false, // Bot không dùng verified tick xanh
        isSetupComplete: true,
        avatar: botUserData.avatar || _getBotAvatar(botUserData.username),
        // Badge system cho bot users
        specialBadge: _getBotBadge(botUserData.username)
      });
      
      await botUser.save();
      console.log(`✅ Created new bot user: ${botUser.username}`);
    }

    // Upload images to Cloudinary (from Unsplash URLs)
    const uploadedImages = [];
    
    for (const imageUrl of images) {
      try {
        // Upload Unsplash image to our Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: 'posts/bot-generated',
          transformation: [
            { width: 1080, height: 1080, crop: 'limit', quality: 'auto' }
          ]
        });
        
        uploadedImages.push(uploadResult.secure_url);
      } catch (uploadError) {
        console.error('❌ Error uploading image to Cloudinary:', uploadError);
        // Use original Unsplash URL as fallback
        uploadedImages.push(imageUrl);
      }
    }

    // Create post
    const newPost = new Post({
      userId: botUser._id,
      content: content,
      images: uploadedImages,
      isBot: true,
      botMetadata: {
        createdBy: 'python_bot',
        topic: bot_metadata?.topic,
        photoData: bot_metadata?.photo_data,
        createdAt: new Date()
      }
    });

    await newPost.save();

    // Populate user data for response
    await newPost.populate('userId', 'username displayName avatar isVerified isBot');

    // Emit to all connected clients for real-time updates
    if (global.socketServer) {
      global.socketServer.io.emit('newPost', {
        post: newPost,
        type: 'bot_generated'
      });
    }

    console.log(`🤖 Bot post created: ${newPost._id} by ${botUser.username}`);

    res.status(201).json({
      success: true,
      message: 'Bot post created successfully',
      post: newPost,
      bot_user: botUser.username
    });

  } catch (error) {
    console.error('❌ Error creating bot post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get bot statistics
 */
const getBotStats = async (req, res) => {
  try {
    // Get all bot users
    const botUsers = await User.find({ isBot: true }).select('username displayName createdAt');
    
    // Get bot posts count
    const botPostsCount = await Post.countDocuments({ isBot: true });
    
    // Get recent bot posts
    const recentBotPosts = await Post.find({ isBot: true })
      .populate('userId', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get bot posts by topic (from metadata)
    const topicStats = await Post.aggregate([
      { $match: { isBot: true, 'botMetadata.topic': { $exists: true } } },
      { $group: { _id: '$botMetadata.topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        total_bot_users: botUsers.length,
        total_bot_posts: botPostsCount,
        bot_users: botUsers,
        recent_posts: recentBotPosts,
        topic_distribution: topicStats
      }
    });

  } catch (error) {
    console.error('❌ Error fetching bot stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete bot post
 */
const deleteBotPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.isBot) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete bot posts'
      });
    }

    await Post.findByIdAndDelete(postId);

    // Emit deletion event
    if (global.socketServer) {
      global.socketServer.io.emit('postDeleted', { postId, type: 'bot_post' });
    }

    res.json({
      success: true,
      message: 'Bot post deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting bot post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update bot user profile
 */
const updateBotUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { displayName, bio, avatar } = req.body;

    const botUser = await User.findOne({ username, isBot: true });
    
    if (!botUser) {
      return res.status(404).json({
        success: false,
        message: 'Bot user not found'
      });
    }

    // Update fields if provided
    if (displayName) botUser.displayName = displayName;
    if (bio) botUser.bio = bio;
    if (avatar) botUser.avatar = avatar;

    await botUser.save();

    res.json({
      success: true,
      message: 'Bot user updated successfully',
      user: botUser
    });

  } catch (error) {
    console.error('❌ Error updating bot user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get realistic avatar for bot user
 */
const _getBotAvatar = (username) => {
  const avatars = {
    'alexchen_photo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'maya_wanderlust': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    'jordan_creates': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'sophie_lifestyle': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    'ryan_tech': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face'
  };
  
  return avatars[username] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face';
};

/**
 * Get special badge for bot user based on their specialty
 */
const _getBotBadge = (username) => {
  const badges = {
    'alexchen_photo': {
      type: 'creator',
      icon: '📸',
      color: '#FF6B35', // Orange for photography
      label: 'Creator'
    },
    'maya_wanderlust': {
      type: 'explorer',
      icon: '🌍',
      color: '#4ECDC4', // Teal for travel
      label: 'Explorer'
    },
    'jordan_creates': {
      type: 'artist',
      icon: '🎨',
      color: '#9B59B6', // Purple for art
      label: 'Artist'
    },
    'sophie_lifestyle': {
      type: 'influencer',
      icon: '✨',
      color: '#E91E63', // Pink for lifestyle
      label: 'Influencer'
    },
    'ryan_tech': {
      type: 'innovator',
      icon: '🚀',
      color: '#2196F3', // Blue for tech
      label: 'Innovator'
    }
  };
  
  return badges[username] || {
    type: 'creator',
    icon: '⭐',
    color: '#FFC107',
    label: 'Creator'
  };
};

module.exports = {
  createBotPost,
  getBotStats,
  deleteBotPost,
  updateBotUser,
  setSocketServer,
  _getBotAvatar,
  _getBotBadge
};
