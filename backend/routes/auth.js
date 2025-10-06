const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// Google OAuth routes
router.post('/google/login', googleAuthController.googleLogin);
router.post('/google/callback', googleAuthController.googleCallback);
router.post('/refresh-token', googleAuthController.refreshToken);
router.post('/logout', authMiddleware, googleAuthController.logout);

// Create bot user endpoint (for quality bot creation)
router.post('/create-bot-user', async (req, res) => {
    try {
        const botData = req.body;
        const { uploadBotAvatar, uploadBotCover } = require('../utils/botCloudinary');
        
        // Validate required fields
        if (!botData.username || !botData.displayName || !botData.googleId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: username, displayName, googleId'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { username: botData.username },
                { googleId: botData.googleId }
            ]
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Bot user already exists'
            });
        }
        
        // Upload images to bot folder if provided
        let avatarUrl = botData.avatar || '';
        let coverImageUrl = botData.coverImage || '';
        
        if (botData.avatar && botData.avatar.startsWith('http')) {
            try {
                console.log(`📸 Uploading bot avatar for ${botData.displayName}...`);
                avatarUrl = await uploadBotAvatar(botData.avatar);
            } catch (error) {
                console.error('⚠️ Avatar upload failed, using original URL:', error.message);
                avatarUrl = botData.avatar; // Fallback to original
            }
        }
        
        if (botData.coverImage && botData.coverImage.startsWith('http')) {
            try {
                console.log(`🖼️ Uploading bot cover for ${botData.displayName}...`);
                coverImageUrl = await uploadBotCover(botData.coverImage);
            } catch (error) {
                console.error('⚠️ Cover upload failed, using original URL:', error.message);
                coverImageUrl = botData.coverImage; // Fallback to original
            }
        }
        
        // Create new bot user
        const mongoose = require('mongoose');
        const newBotUser = new User({
            _id: new mongoose.Types.ObjectId().toString(),
            googleId: botData.googleId,
            username: botData.username,
            displayName: botData.displayName,
            bio: botData.bio || '',
            avatar: avatarUrl,
            coverImage: coverImageUrl,
            location: botData.location || '',
            website: botData.website || '',
            phone: botData.phone || '',
            pronouns: botData.pronouns || '',
            isBot: true,
            botType: botData.botType || 'lifestyle',
            isVerified: botData.isVerified || false,
            isSetupComplete: true,
            hasCustomDisplayName: botData.hasCustomDisplayName || true,
            hasCustomAvatar: botData.hasCustomAvatar || true,
            followerCount: botData.followerCount || 0,
            followingCount: botData.followingCount || 0,
            postCount: botData.postCount || 0,
            isOnline: botData.isOnline || false,
            createdAt: botData.createdAt ? new Date(botData.createdAt) : new Date(),
            lastLoginAt: botData.lastLoginAt ? new Date(botData.lastLoginAt) : new Date(),
            lastSeen: botData.lastSeen ? new Date(botData.lastSeen) : new Date(),
            bot_metadata: botData.bot_metadata || {}
        });
        
        await newBotUser.save();
        
        console.log(`✅ Created bot user: ${newBotUser.displayName} (@${newBotUser.username})`);
        
        res.status(201).json({
            success: true,
            message: 'Quality bot user created successfully',
            data: {
                id: newBotUser._id,
                username: newBotUser.username,
                displayName: newBotUser.displayName,
                isBot: newBotUser.isBot,
                botType: newBotUser.botType,
                avatar: newBotUser.avatar,
                coverImage: newBotUser.coverImage
            }
        });
        
    } catch (error) {
        console.error('Error creating bot user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bot user',
            error: error.message
        });
    }
});

// Health check for auth service
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Google Auth Service',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
