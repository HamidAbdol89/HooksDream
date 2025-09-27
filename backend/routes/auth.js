const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const { authMiddleware } = require('../middleware/auth');

// Google OAuth routes
router.post('/google/login', googleAuthController.googleLogin);
router.post('/google/callback', googleAuthController.googleCallback);
router.post('/refresh-token', googleAuthController.refreshToken);
router.post('/logout', authMiddleware, googleAuthController.logout);

// Health check for auth service
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Google Auth Service',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
