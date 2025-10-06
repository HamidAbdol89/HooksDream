const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');

// Import controllers
const userController = require('../controllers/userController');
const followController = require('../controllers/followController');
const { getPopularUsers } = require('../controllers/popularUser');
const { optionalAuth, authMiddleware } = require('../middleware/auth');

// Rate limiting cho các endpoints quan trọng
const updateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 15, // Tăng lên 15 updates (cho phép testing và multiple image uploads)
    message: { success: false, message: 'Too many update attempts, please try again later.' }
});

// Cấu hình multer cho upload ảnh
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Routes
// Note: Login is now handled by /api/auth/google/login
router.get('/profile/me', authMiddleware, userController.getCurrentUserProfile);
router.get('/profile/:userId', optionalAuth, userController.getProfile); // ✅ THÊM optionalAuth
router.put('/profile/:hashId', updateLimiter, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), userController.updateProfile);
// Bot-aware middleware for follow actions
const botAwareAuth = (req, res, next) => {
    // Check if this is a bot request with X-Bot-ID header
    if (req.headers['x-bot-id']) {
        // Skip auth for bot requests
        req.userId = req.headers['x-bot-id']; // Set userId from bot header
        return next();
    }
    // Use normal auth for regular users
    return authMiddleware(req, res, next);
};

router.post('/:userId/follow', botAwareAuth, followController.followUser); // ✅ Bot-aware auth
router.get('/:userId/follow/status', authMiddleware, followController.checkFollowStatus); // ✅ THÊM route mới
router.get('/:userId/stats', userController.getUserStats);
router.get('/:userId/following', optionalAuth, followController.getFollowing); // ✅ THÊM optionalAuth
router.get('/:userId/followers', optionalAuth, followController.getFollowers); // ✅ THÊM optionalAuth
router.get('/', userController.getUsers);
router.delete('/profile/:hashId', userController.deleteUser);
router.get('/popular', optionalAuth, getPopularUsers);

// Admin cleanup endpoint (for bot management)
router.delete('/admin/cleanup/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const User = require('../models/User');
        const Post = require('../models/Post');
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Safety check - only delete bot accounts
        if (!user.isBot) {
            return res.status(403).json({
                success: false,
                message: 'Can only delete bot accounts'
            });
        }
        
        // Delete user's posts first
        await Post.deleteMany({ userId: userId });
        
        // Delete user
        await User.findByIdAndDelete(userId);
        
        res.json({
            success: true,
            message: `Bot account ${user.displayName} deleted successfully`
        });
        
    } catch (error) {
        console.error('Error deleting bot user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bot user',
            error: error.message
        });
    }
});

// Bot integration endpoint
router.get('/random-for-bot', userController.getRandomUserForBot);

// Bot Cloudinary cleanup endpoint
router.delete('/bot/cleanup-cloudinary', async (req, res) => {
    try {
        const { cleanupAllBotImages } = require('../utils/botCloudinary');
        
        console.log('🧹 Starting Cloudinary bot images cleanup...');
        const result = await cleanupAllBotImages();
        
        if (result.success) {
            console.log(`✅ Deleted ${result.deleted} bot images from Cloudinary`);
            res.json({
                success: true,
                deleted: result.deleted,
                message: result.message
            });
        } else {
            console.error('❌ Cloudinary cleanup failed:', result.error);
            res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Error during Cloudinary cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Cloudinary cleanup failed',
            error: error.message
        });
    }
});

// Cleanup orphaned images endpoint
router.post('/cleanup-orphaned-images', async (req, res) => {
    try {
        const { protected_urls } = req.body;
        const cloudinary = require('cloudinary').v2;
        
        if (!protected_urls || !Array.isArray(protected_urls)) {
            return res.status(400).json({
                success: false,
                message: 'protected_urls array is required'
            });
        }
        
        console.log(`🔍 Starting orphaned images scan. Protected URLs: ${protected_urls.length}`);
        
        // Get all images from upload-social folder
        const allImages = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'upload-social/',
            max_results: 500,
            resource_type: 'image'
        });
        
        console.log(`📊 Found ${allImages.resources.length} images in upload-social folder`);
        
        // Find orphaned images (not in protected list)
        const protectedSet = new Set(protected_urls);
        const orphanedImages = [];
        
        for (const image of allImages.resources) {
            const imageUrl = image.secure_url;
            if (!protectedSet.has(imageUrl)) {
                orphanedImages.push(image.public_id);
            }
        }
        
        console.log(`🗑️ Found ${orphanedImages.length} orphaned images to delete`);
        
        // Delete orphaned images in batches
        let deletedCount = 0;
        const batchSize = 100;
        
        for (let i = 0; i < orphanedImages.length; i += batchSize) {
            const batch = orphanedImages.slice(i, i + batchSize);
            
            try {
                const deleteResult = await cloudinary.api.delete_resources(batch, {
                    resource_type: 'image'
                });
                
                deletedCount += Object.keys(deleteResult.deleted).length;
                console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${Object.keys(deleteResult.deleted).length} images`);
                
            } catch (error) {
                console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
            }
        }
        
        console.log(`🎉 Cleanup completed. Deleted ${deletedCount} orphaned images`);
        
        res.json({
            success: true,
            scanned: allImages.resources.length,
            deleted: deletedCount,
            protected: protected_urls.length,
            message: 'Orphaned images cleanup completed'
        });
        
    } catch (error) {
        console.error('❌ Error during orphaned images cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Orphaned images cleanup failed',
            error: error.message
        });
    }
});

// Error handling middleware cho multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large (max 10MB)',
                statusCode: 400
            });
        }
    }
    
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only image files are allowed',
            statusCode: 400
        });
    }
    
    next(error);
});

module.exports = router;