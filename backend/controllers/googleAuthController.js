const User = require('../models/User');
const { createResponse, generateUniqueUsername } = require('../utils/helpers');
const { uploadImageToCloudinary } = require('../utils/cloudinary');
const googleAuthService = require('../services/googleAuthService');
const axios = require('axios');

// Google OAuth login/register
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        console.log('🔐 Google login request received');
        
        // Validate required fields
        if (!idToken) {
            return res.status(400).json(
                createResponse(false, 'Google ID token is required', null, null, 400)
            );
        }
        
        // Verify Google token and get user info
        let googleUserInfo;
        try {
            googleUserInfo = await googleAuthService.verifyGoogleToken(idToken);
        } catch (error) {
            return res.status(401).json(
                createResponse(false, 'Invalid Google token', null, null, 401)
            );
        }
        
        console.log('✅ Google token verified:', googleUserInfo.email);
        
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: googleUserInfo.googleId });
        let isNewUser = false;
        
        if (!user) {
            isNewUser = true;
            // Create new user
            const randomUsername = await generateUniqueUsername(googleUserInfo.googleId);
            
            // Upload Google avatar to Cloudinary
            let avatarUrl = '';
            if (googleUserInfo.picture) {
                try {
                    const response = await axios.get(googleUserInfo.picture, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data);
                    avatarUrl = await uploadImageToCloudinary(buffer, 'avatar', googleUserInfo.googleId);
                } catch (error) {
                    console.error('⚠️ Error uploading Google avatar to Cloudinary:', error);
                    avatarUrl = googleUserInfo.picture; // Fallback to original URL
                }
            }
            
            user = new User({
                _id: googleUserInfo.googleId,
                googleId: googleUserInfo.googleId,
                email: googleUserInfo.email.toLowerCase(),
                displayName: googleUserInfo.name || randomUsername,
                avatar: avatarUrl,
                username: randomUsername,
                isSetupComplete: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: new Date()
            });
            
            await user.save();
            console.log('✅ New Google user created:', user.username);
        } else {
            // Update existing Google user
            let isUpdated = false;
            
            if (googleUserInfo.email && user.email !== googleUserInfo.email.toLowerCase()) {
                user.email = googleUserInfo.email.toLowerCase();
                isUpdated = true;
            }
            
            if (googleUserInfo.name && user.displayName !== googleUserInfo.name) {
                user.displayName = googleUserInfo.name;
                isUpdated = true;
            }
            
            // Update avatar if Google has a new one
            if (googleUserInfo.picture && user.avatar !== googleUserInfo.picture) {
                if (googleUserInfo.picture.startsWith('http') && !googleUserInfo.picture.includes('cloudinary.com')) {
                    try {
                        console.log('📤 Uploading updated Google avatar to Cloudinary...');
                        const response = await axios.get(googleUserInfo.picture, { responseType: 'arraybuffer' });
                        const buffer = Buffer.from(response.data);
                        user.avatar = await uploadImageToCloudinary(buffer, 'avatar', user._id);
                        isUpdated = true;
                        console.log('✅ Google avatar updated successfully');
                    } catch (error) {
                        console.error('⚠️ Error updating Google avatar:', error);
                        user.avatar = googleUserInfo.picture;
                        isUpdated = true;
                    }
                } else {
                    user.avatar = googleUserInfo.picture;
                    isUpdated = true;
                }
            }
            
            // Update last login
            user.lastLoginAt = new Date();
            user.updatedAt = new Date();
            
            if (isUpdated) {
                await user.save();
                console.log('🔄 Google user info updated:', user._id);
            }
            
            console.log('✅ Google user login successful:', user._id);
        }
        
        // Generate JWT token
        const jwtToken = googleAuthService.generateJWTToken(user);
        
        // Return user data with token
        return res.status(isNewUser ? 201 : 200).json(
            createResponse(true, isNewUser ? 'User created successfully' : 'Login successful', {
                user: {
                    ...user.toObject(),
                    isSetupComplete: true
                },
                token: jwtToken
            }, null, isNewUser ? 201 : 200)
        );
        
    } catch (error) {
        console.error('⚠️ Google login error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json(
                createResponse(false, `${field} already exists`, null, null, 409)
            );
        }
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json(
                createResponse(false, 'Validation failed', null, errors, 400)
            );
        }
        
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Refresh JWT token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json(
                createResponse(false, 'Refresh token is required', null, null, 400)
            );
        }
        
        // Verify refresh token
        const decoded = googleAuthService.verifyJWTToken(refreshToken);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json(
                createResponse(false, 'Invalid refresh token', null, null, 401)
            );
        }
        
        // Get user and generate new tokens
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        const newAccessToken = googleAuthService.generateJWTToken(user);
        const newRefreshToken = googleAuthService.generateRefreshToken(user);
        
        res.json(
            createResponse(true, 'Token refreshed successfully', {
                token: newAccessToken,
                refreshToken: newRefreshToken
            })
        );
        
    } catch (error) {
        console.error('⚠️ Token refresh error:', error);
        res.status(401).json(
            createResponse(false, 'Invalid or expired refresh token', null, null, 401)
        );
    }
};

// Logout (optional - mainly for client-side token cleanup)
exports.logout = async (req, res) => {
    try {
        // In JWT-based auth, logout is mainly handled client-side
        // But we can log the action for analytics
        console.log('👋 User logged out:', req.user?._id);
        
        res.json(
            createResponse(true, 'Logged out successfully')
        );
        
    } catch (error) {
        console.error('⚠️ Logout error:', error);
        res.status(500).json(
            createResponse(false, 'Logout failed', null, null, 500)
        );
    }
};
