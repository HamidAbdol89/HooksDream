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
router.get('/profile/:userId', userController.getProfile);
router.put('/profile/:hashId', updateLimiter, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), userController.updateProfile);
router.post('/:userId/follow', authMiddleware, followController.followUser); // ✅ THÊM authMiddleware
router.get('/:userId/follow/status', authMiddleware, followController.checkFollowStatus); // ✅ THÊM route mới
router.get('/:userId/stats', userController.getUserStats);
router.get('/:userId/following', optionalAuth, followController.getFollowing); // ✅ THÊM optionalAuth
router.get('/:userId/followers', optionalAuth, followController.getFollowers); // ✅ THÊM optionalAuth
router.get('/', userController.getUsers);
router.delete('/profile/:hashId', userController.deleteUser);
router.get('/popular', optionalAuth, getPopularUsers);

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