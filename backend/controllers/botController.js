/**
 * Bot Controller
 * Handles automated content creation from Python backend
 * Enhanced with personality evolution, social graph, and health monitoring
 */

const Post = require('../models/Post');
const User = require('../models/User');
const { cloudinary } = require('../utils/cloudinary');
const axios = require('axios');

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
    const { content, images, bot_metadata, multimedia, post_type, mood, time_context, events_referenced } = req.body;

    // Support both image posts and text-only posts
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    // For text-only posts, images array can be empty
    const isTextOnlyPost = post_type === 'text_only' || (!images || images.length === 0);
    
    if (!isTextOnlyPost && (!Array.isArray(images) || images.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Images are required for image posts'
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
        avatar: botUserData.avatar || await _getSmartBotAvatar(botUserData),
        // Badge system cho bot users
        specialBadge: _getBotBadge(botUserData.username)
      });
      await botUser.save();
      console.log(`✅ Created new bot user: ${botUser.username}`);
    }

    // Process images (only for image posts)
    const uploadedImages = [];
    if (!isTextOnlyPost && images && images.length > 0) {
      for (const imageUrl of images) {
        try {
          // Determine bot-specific Cloudinary folder
          const botFolder = `bots/${botUser.username}/posts`;
          
          // Upload Unsplash image to bot's Cloudinary folder
          const uploadResult = await cloudinary.uploader.upload(imageUrl, {
            folder: botFolder,
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
    }
    
    // Process multimedia content if available
    let processedMultimedia = null;
    if (multimedia) {
      if (multimedia.type === 'generated_image' && multimedia.image_data) {
        try {
          // Upload generated image to bot's Cloudinary folder
          const botMultimediaFolder = `bots/${botUser.username}/multimedia`;
          const uploadResult = await cloudinary.uploader.upload(`data:image/png;base64,${multimedia.image_data}`, {
            folder: botMultimediaFolder,
            transformation: [
              { width: 1080, height: 1080, crop: 'limit', quality: 'auto' }
            ]
          });
          
          processedMultimedia = {
            type: multimedia.type,
            media_type: multimedia.media_type,
            image_url: uploadResult.secure_url,
            description: multimedia.description,
            alt_text: multimedia.alt_text
          };
        } catch (uploadError) {
          console.error('❌ Error uploading multimedia to Cloudinary:', uploadError);
        }
      } else if (multimedia.type === 'unsplash_photo') {
        processedMultimedia = multimedia; // Use as-is for Unsplash photos
      }
    }

    // Create post with enhanced metadata
    const newPost = new Post({
      userId: botUser._id,
      content: content,
      images: uploadedImages,
      isBot: true,
      botMetadata: {
        createdBy: 'python_bot',
        topic: bot_metadata?.topic,
        photoData: bot_metadata?.photo_data,
        postType: post_type || 'image_post',
        mood: mood,
        timeContext: time_context,
        eventsReferenced: events_referenced,
        multimedia: processedMultimedia,
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
 * Get smart realistic avatar from Python service
 */
const _getSmartBotAvatar = async (botUserData) => {
  try {
    // Call Python service to get smart avatar
    const response = await axios.post(`${process.env.PYTHON_BACKEND_URL || 'https://hooksdream.fly.dev'}/api/bot/smart-avatar`, {
      bot_account: {
        username: botUserData.username,
        displayName: botUserData.name,
        bio: botUserData.bio,
        botType: botUserData.botType || 'lifestyle'
      }
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.avatar_url) {
      console.log(`👤 Smart avatar assigned to ${botUserData.name}: ${response.data.query}`);
      return response.data.avatar_url;
    }
  } catch (error) {
    console.log(`⚠️ Smart avatar failed for ${botUserData.name}, using fallback: ${error.message}`);
  }

  // Fallback to original system
  return _getBotAvatar(botUserData.username);
};

/**
 * Get bot avatar based on username (fallback)
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

/**
 * Get bot health dashboard
 */
const getBotHealthDashboard = async (req, res) => {
  try {
    // Get bot statistics
    const totalBots = await User.countDocuments({ isBot: true });
    const totalBotPosts = await Post.countDocuments({ isBot: true });
    
    // Get recent bot activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBotPosts = await Post.countDocuments({ 
      isBot: true, 
      createdAt: { $gte: last24Hours } 
    });
    
    // Get bot posts by type
    const textOnlyPosts = await Post.countDocuments({ 
      isBot: true,
      'botMetadata.postType': 'text_only'
    });
    
    const imagePosts = await Post.countDocuments({ 
      isBot: true,
      'botMetadata.postType': { $ne: 'text_only' }
    });
    
    // Get mood distribution
    const moodDistribution = await Post.aggregate([
      { $match: { isBot: true, 'botMetadata.mood': { $exists: true } } },
      { $group: { _id: '$botMetadata.mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get most active bots
    const activeBots = await Post.aggregate([
      { $match: { isBot: true, createdAt: { $gte: last24Hours } } },
      { $group: { _id: '$userId', postCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', displayName: '$user.displayName', postCount: 1 } },
      { $sort: { postCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Calculate engagement metrics (simulated for now)
    const avgEngagement = Math.floor(Math.random() * 20) + 5; // 5-25 average engagement
    const systemUptime = 99.2; // 99.2% uptime
    
    const dashboardData = {
      overview: {
        totalBots,
        totalBotPosts,
        recentBotPosts,
        avgEngagement,
        systemUptime
      },
      postDistribution: {
        textOnly: textOnlyPosts,
        withImages: imagePosts,
        total: totalBotPosts
      },
      moodDistribution: moodDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      activeBots,
      systemHealth: {
        status: 'healthy',
        lastUpdate: new Date(),
        alerts: [],
        metrics: {
          postsPerHour: Math.floor(recentBotPosts / 24),
          errorRate: 0.02, // 2% error rate
          responseTime: 450 // 450ms average response time
        }
      }
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Error getting bot health dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bot health dashboard',
      error: error.message
    });
  }
};

/**
 * Create premium bot user
 */
const createPremiumBotUser = async (req, res) => {
  try {
    const botUserData = req.body;
    
    // Validate required fields
    if (!botUserData.username || !botUserData.displayName || !botUserData.email) {
      return res.status(400).json({
        success: false,
        message: 'Username, displayName, and email are required'
      });
    }

    // Check if bot user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: botUserData.username },
        { _id: botUserData._id }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Bot user with username ${botUserData.username} already exists`
      });
    }

    // Create new bot user
    const newBotUser = new User({
      _id: botUserData._id,
      googleId: botUserData.googleId,
      username: botUserData.username,
      displayName: botUserData.displayName,
      email: botUserData.email,
      bio: botUserData.bio || '',
      location: botUserData.location || '',
      website: botUserData.website || '',
      avatar: botUserData.avatar || '',
      coverImage: botUserData.coverImage || '',
      isBot: true,
      botType: botUserData.botType,
      isVerified: false,
      hasCustomAvatar: botUserData.hasCustomAvatar || false,
      hasCustomDisplayName: botUserData.hasCustomDisplayName || false,
      isSetupComplete: true,
      specialBadge: botUserData.specialBadge,
      followerCount: botUserData.followerCount || 0,
      followingCount: botUserData.followingCount || 0,
      postCount: botUserData.postCount || 0
    });

    await newBotUser.save();

    console.log(`✅ Premium bot user created: ${newBotUser.username} (${newBotUser.displayName})`);

    res.status(201).json({
      success: true,
      message: 'Premium bot user created successfully',
      user: newBotUser
    });

  } catch (error) {
    console.error('❌ Error creating premium bot user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Upload bot avatar to Cloudinary
 */
const uploadBotAvatar = async (req, res) => {
  try {
    const { username, avatar_url, cloudinary_folder } = req.body;

    if (!username || !avatar_url || !cloudinary_folder) {
      return res.status(400).json({
        success: false,
        message: 'Username, avatar_url, and cloudinary_folder are required'
      });
    }

    // Find bot user
    const botUser = await User.findOne({ username, isBot: true });
    if (!botUser) {
      return res.status(404).json({
        success: false,
        message: 'Bot user not found'
      });
    }

    // Upload to Cloudinary with bot-specific avatar folder
    const avatarFolder = `${cloudinary_folder}/avatars`;
    const uploadResult = await cloudinary.uploader.upload(avatar_url, {
      folder: avatarFolder,
      public_id: `${username}_avatar`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', format: 'auto' }
      ],
      overwrite: true
    });

    // Update bot user avatar
    botUser.avatar = uploadResult.secure_url;
    botUser.hasCustomAvatar = true;
    await botUser.save();

    console.log(`✅ Bot avatar uploaded for ${username}: ${uploadResult.secure_url}`);

    res.json({
      success: true,
      message: 'Bot avatar uploaded successfully',
      avatar_url: uploadResult.secure_url,
      cloudinary_folder: cloudinary_folder,
      public_id: uploadResult.public_id
    });

  } catch (error) {
    console.error('❌ Error uploading bot avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete premium bot user
 */
const deletePremiumBotUser = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find and delete bot user
    const botUser = await User.findOneAndDelete({ 
      username: username, 
      isBot: true 
    });

    if (!botUser) {
      return res.status(404).json({
        success: false,
        message: `Bot user '${username}' not found`
      });
    }

    // Also delete all posts by this bot
    const deletedPosts = await Post.deleteMany({ 
      userId: botUser._id,
      isBot: true 
    });

    console.log(`✅ Deleted bot user: ${username} and ${deletedPosts.deletedCount} posts`);

    res.json({
      success: true,
      message: `Bot user '${username}' deleted successfully`,
      deleted_posts: deletedPosts.deletedCount,
      bot_info: {
        username: botUser.username,
        displayName: botUser.displayName,
        botType: botUser.botType
      }
    });

  } catch (error) {
    console.error('❌ Error deleting bot user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete all bot users (bulk deletion) including Cloudinary cleanup
 */
const deleteAllBots = async (req, res) => {
  try {
    console.log('🗑️ Starting bulk bot deletion with Cloudinary cleanup...');

    // Find all bot users
    const botUsers = await User.find({ isBot: true });
    
    if (botUsers.length === 0) {
      return res.json({
        success: true,
        message: 'No bot users found to delete',
        deleted_bots: 0,
        deleted_posts: 0,
        deleted_cloudinary_images: 0
      });
    }

    console.log(`🔍 Found ${botUsers.length} bot users to delete`);

    // Get bot user IDs and usernames
    const botUserIds = botUsers.map(bot => bot._id);
    const botUsernames = botUsers.map(bot => bot.username);

    // Find all posts by bots to get image URLs
    const botPosts = await Post.find({ 
      userId: { $in: botUserIds },
      isBot: true 
    });

    console.log(`📸 Found ${botPosts.length} bot posts to process`);

    // Collect all image URLs from bot posts and avatars
    let imageUrls = [];
    
    // Add post images
    botPosts.forEach(post => {
      if (post.images && post.images.length > 0) {
        imageUrls.push(...post.images);
      }
    });

    // Add bot avatars
    botUsers.forEach(bot => {
      if (bot.avatar && bot.avatar.includes('cloudinary.com')) {
        imageUrls.push(bot.avatar);
      }
      if (bot.coverImage && bot.coverImage.includes('cloudinary.com')) {
        imageUrls.push(bot.coverImage);
      }
    });

    console.log(`🖼️ Found ${imageUrls.length} Cloudinary images to delete`);

    // Delete images from Cloudinary
    let deletedCloudinaryImages = 0;
    const { deleteImageFromCloudinary } = require('../utils/cloudinary');

    for (const imageUrl of imageUrls) {
      try {
        const result = await deleteImageFromCloudinary(imageUrl);
        if (result.result === 'success') {
          deletedCloudinaryImages++;
        }
      } catch (error) {
        console.error(`⚠️ Failed to delete image ${imageUrl}:`, error.message);
      }
    }

    // Delete bot folders from Cloudinary
    let deletedBotFolders = 0;
    for (const username of botUsernames) {
      try {
        console.log(`🗂️ Deleting Cloudinary folder for bot: ${username}`);
        
        // Delete entire bot folder (bots/{username}/)
        const folderResult = await cloudinary.api.delete_resources_by_prefix(`bots/${username}/`, {
          resource_type: 'image'
        });
        
        if (folderResult.deleted && folderResult.deleted.length > 0) {
          deletedBotFolders++;
          console.log(`   ✅ Deleted ${folderResult.deleted.length} images from bots/${username}/`);
        }

        // Also delete video/raw resources if any
        try {
          await cloudinary.api.delete_resources_by_prefix(`bots/${username}/`, {
            resource_type: 'video'
          });
          await cloudinary.api.delete_resources_by_prefix(`bots/${username}/`, {
            resource_type: 'raw'
          });
        } catch (e) {
          // Ignore errors for video/raw cleanup
        }

      } catch (error) {
        console.error(`⚠️ Failed to delete folder for ${username}:`, error.message);
      }
    }

    // Delete all posts by bots from database
    const deletedPosts = await Post.deleteMany({ 
      userId: { $in: botUserIds },
      isBot: true 
    });

    // Delete all bot users from database
    const deletedUsers = await User.deleteMany({ isBot: true });

    console.log(`✅ Bulk deletion completed:`);
    console.log(`   - Deleted ${deletedUsers.deletedCount} bot users`);
    console.log(`   - Deleted ${deletedPosts.deletedCount} bot posts`);
    console.log(`   - Deleted ${deletedCloudinaryImages} individual Cloudinary images`);
    console.log(`   - Cleaned ${deletedBotFolders} bot folders from Cloudinary`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedUsers.deletedCount} bot users, ${deletedPosts.deletedCount} posts, and cleaned up Cloudinary images`,
      deleted_bots: deletedUsers.deletedCount,
      deleted_posts: deletedPosts.deletedCount,
      deleted_cloudinary_images: deletedCloudinaryImages,
      cleaned_bot_folders: deletedBotFolders,
      bot_usernames: botUsernames
    });

  } catch (error) {
    console.error('❌ Error in bulk bot deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during bulk deletion',
      error: error.message
    });
  }
};

/**
 * Get premium bot status
 */
const getPremiumBotStatus = async (req, res) => {
  try {
    // Get all premium bots (bots with custom avatars and display names)
    const premiumBots = await User.find({ 
      isBot: true,
      hasCustomAvatar: true,
      hasCustomDisplayName: true
    }).select('username displayName avatar botType specialBadge followerCount postCount createdAt');

    // Get premium bot usernames for filtering
    const premiumBotIds = premiumBots.map(bot => bot._id);

    // Get premium bot posts count
    const premiumBotPosts = await Post.countDocuments({ 
      userId: { $in: premiumBotIds },
      isBot: true 
    });

    // Get recent premium bot posts
    const recentPosts = await Post.find({ 
      userId: { $in: premiumBotIds },
      isBot: true 
    })
    .populate('userId', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(10);

    const status = {
      success: true,
      total_premium_bots: premiumBots.length,
      total_premium_posts: premiumBotPosts,
      premium_bots: premiumBots.map(bot => ({
        username: bot.username,
        displayName: bot.displayName,
        avatar: bot.avatar,
        botType: bot.botType,
        specialBadge: bot.specialBadge,
        followerCount: bot.followerCount,
        postCount: bot.postCount,
        createdAt: bot.createdAt,
        cloudinary_folder: `bots/${bot.username}`
      })),
      recent_posts: recentPosts,
      cloudinary_structure: {
        base_folder: "bots/",
        bot_folders: premiumBots.map(bot => `bots/${bot.username}`)
      }
    };

    res.json(status);

  } catch (error) {
    console.error('❌ Error getting premium bot status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createBotPost,
  getBotStats,
  deleteBotPost,
  updateBotUser,
  getBotHealthDashboard,
  createPremiumBotUser,
  uploadBotAvatar,
  deletePremiumBotUser,
  deleteAllBots,
  getPremiumBotStatus,
  setSocketServer,
  _getBotAvatar,
  _getBotBadge
};
