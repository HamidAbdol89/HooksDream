const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload bot avatar to Cloudinary /bot/avatars folder
 */
const uploadBotAvatar = async (imageUrl) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'bot/avatars',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ],
      public_id: `bot_avatar_${Date.now()}_${Math.round(Math.random() * 1e6)}`
    });
    
    console.log(`✅ Bot avatar uploaded to: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading bot avatar:', error);
    throw error;
  }
};

/**
 * Upload bot cover image to Cloudinary /bot/covers folder
 */
const uploadBotCover = async (imageUrl) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'bot/covers',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      transformation: [
        { width: 1200, height: 400, crop: 'fill' },
        { quality: 'auto:good' }
      ],
      public_id: `bot_cover_${Date.now()}_${Math.round(Math.random() * 1e6)}`
    });
    
    console.log(`✅ Bot cover uploaded to: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading bot cover:', error);
    throw error;
  }
};

/**
 * Upload bot post images to Cloudinary /bot/posts folder
 */
const uploadBotPostImage = async (imageUrl) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'bot/posts',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      transformation: [
        { width: 1080, height: 1080, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `bot_post_${Date.now()}_${Math.round(Math.random() * 1e6)}`
    });
    
    console.log(`✅ Bot post image uploaded to: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading bot post image:', error);
    throw error;
  }
};

/**
 * Delete bot image from Cloudinary
 */
const deleteBotImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return { result: 'skipped', message: 'Not a Cloudinary URL' };
    }

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return { result: 'error', message: 'Invalid Cloudinary URL format' };
    }

    let publicIdWithExtension = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove version if present
    if (publicIdWithExtension.startsWith('v') && /^v\d+\//.test(publicIdWithExtension)) {
      publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
    }
    
    // Remove file extension
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    if (result.result === 'ok') {
      console.log(`✅ Bot image deleted: ${publicId}`);
      return { result: 'success', publicId, message: 'Bot image deleted successfully' };
    } else {
      return { result: result.result, publicId, message: `Delete result: ${result.result}` };
    }

  } catch (err) {
    console.error('❌ Error deleting bot image from Cloudinary:', err);
    return { result: 'error', error: err.message };
  }
};

/**
 * Get bot folder statistics
 */
const getBotFolderStats = async () => {
  try {
    const avatars = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'bot/avatars',
      max_results: 500
    });
    
    const covers = await cloudinary.api.resources({
      type: 'upload', 
      prefix: 'bot/covers',
      max_results: 500
    });
    
    const posts = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'bot/posts', 
      max_results: 500
    });
    
    return {
      avatars: avatars.resources.length,
      covers: covers.resources.length,
      posts: posts.resources.length,
      total: avatars.resources.length + covers.resources.length + posts.resources.length
    };
  } catch (error) {
    console.error('❌ Error getting bot folder stats:', error);
    return { avatars: 0, covers: 0, posts: 0, total: 0 };
  }
};

/**
 * Cleanup all bot images (for complete cleanup)
 */
const cleanupAllBotImages = async () => {
  try {
    console.log('🗑️ Starting bot images cleanup...');
    
    // Delete all images in bot folder
    const result = await cloudinary.api.delete_resources_by_prefix('bot/', {
      resource_type: 'image'
    });
    
    console.log(`✅ Deleted ${result.deleted.length} bot images`);
    return {
      success: true,
      deleted: result.deleted.length,
      message: 'Bot images cleanup completed'
    };
  } catch (error) {
    console.error('❌ Error cleaning up bot images:', error);
    return {
      success: false,
      error: error.message,
      message: 'Bot images cleanup failed'
    };
  }
};

module.exports = {
  uploadBotAvatar,
  uploadBotCover,
  uploadBotPostImage,
  deleteBotImage,
  getBotFolderStats,
  cleanupAllBotImages
};
