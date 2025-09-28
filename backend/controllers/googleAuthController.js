const User = require('../models/User');
const { createResponse, generateUniqueUsername } = require('../utils/helpers');
const { uploadImageToCloudinary } = require('../utils/cloudinary');
const googleAuthService = require('../services/googleAuthService');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Google OAuth login/register
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
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
            } else {
            // Update existing Google user - BUT PRESERVE USER EDITS
            let isUpdated = false;
            
            // Always update email if changed (security requirement)
            if (googleUserInfo.email && user.email !== googleUserInfo.email.toLowerCase()) {
                user.email = googleUserInfo.email.toLowerCase();
                isUpdated = true;
            }
            
            // ✅ ONLY update displayName if user hasn't customized it
            if (googleUserInfo.name && !user.hasCustomDisplayName && user.displayName !== googleUserInfo.name) {
                user.displayName = googleUserInfo.name;
                isUpdated = true;
            }
            
            // ✅ ONLY update avatar if user hasn't uploaded custom avatar
            if (googleUserInfo.picture && !user.hasCustomAvatar && user.avatar !== googleUserInfo.picture) {
                if (googleUserInfo.picture.startsWith('http') && !googleUserInfo.picture.includes('cloudinary.com')) {
                    try {
                        const response = await axios.get(googleUserInfo.picture, { responseType: 'arraybuffer' });
                        const buffer = Buffer.from(response.data);
                        user.avatar = await uploadImageToCloudinary(buffer, 'avatar', user._id);
                        isUpdated = true;
                        } catch (error) {
                        user.avatar = googleUserInfo.picture;
                        isUpdated = true;
                    }
                } else {
                    user.avatar = googleUserInfo.picture;
                    isUpdated = true;
                }
            }
            
            // Always update last login
            user.lastLoginAt = new Date();
            user.updatedAt = new Date();
            
            if (isUpdated) {
                await user.save();
                }
            
            }
        
        // Generate JWT token
        const jwtToken = googleAuthService.generateJWTToken(user);
        
        // Return complete user data with token and profile in single response
        const completeUserData = {
            ...user.toObject(),
            isSetupComplete: true,
            // Add computed fields
            handle: `@${user.username}`,
            hashId: user.googleId // For compatibility
        };
        
        return res.status(isNewUser ? 201 : 200).json(
            createResponse(true, isNewUser ? 'User created successfully' : 'Login successful', {
                user: completeUserData,
                profile: completeUserData, // Same data for profile to avoid duplicate API calls
                token: jwtToken,
                isNewUser
            }, null, isNewUser ? 201 : 200)
        );
        
    } catch (error) {
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
        res.status(401).json(
            createResponse(false, 'Invalid or expired refresh token', null, null, 401)
        );
    }
};

// Google OAuth callback handler
exports.googleCallback = async (req, res) => {
    try {
        const { code, state } = req.body;
        
        // Validate required fields
        if (!code) {
            return res.status(400).json(
                createResponse(false, 'Authorization code is required', null, null, 400)
            );
        }
        
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Get user info from Google
        const response = await axios.get(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
        );
        
        const googleUserInfo = {
            googleId: response.data.id,
            email: response.data.email,
            name: response.data.name,
            picture: response.data.picture,
            emailVerified: response.data.verified_email
        };
        
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
        } else {
            // Update existing user - BUT PRESERVE USER EDITS
            let isUpdated = false;
            
            // Always update email if changed (security requirement)
            if (googleUserInfo.email && user.email !== googleUserInfo.email.toLowerCase()) {
                user.email = googleUserInfo.email.toLowerCase();
                isUpdated = true;
            }
            
            // ✅ ONLY update displayName if user hasn't customized it
            if (googleUserInfo.name && !user.hasCustomDisplayName && user.displayName !== googleUserInfo.name) {
                user.displayName = googleUserInfo.name;
                isUpdated = true;
            }
            
            // ✅ ONLY update avatar if user hasn't uploaded custom avatar
            if (googleUserInfo.picture && !user.hasCustomAvatar && user.avatar !== googleUserInfo.picture) {
                if (googleUserInfo.picture.startsWith('http') && !googleUserInfo.picture.includes('cloudinary.com')) {
                    try {
                        const response = await axios.get(googleUserInfo.picture, { responseType: 'arraybuffer' });
                        const buffer = Buffer.from(response.data);
                        user.avatar = await uploadImageToCloudinary(buffer, 'avatar', user._id);
                        isUpdated = true;
                    } catch (error) {
                        user.avatar = googleUserInfo.picture;
                        isUpdated = true;
                    }
                } else {
                    user.avatar = googleUserInfo.picture;
                    isUpdated = true;
                }
            }
            
            // Always update last login
            user.lastLoginAt = new Date();
            user.updatedAt = new Date();
            
            if (isUpdated) {
                await user.save();
            }
        }
        
        // Generate JWT token
        const jwtToken = googleAuthService.generateJWTToken(user);
        
        // Return complete user data with token and profile in single response
        const completeUserData = {
            ...user.toObject(),
            isSetupComplete: true,
            handle: `@${user.username}`,
            hashId: user.googleId
        };
        
        return res.status(isNewUser ? 201 : 200).json(
            createResponse(true, isNewUser ? 'User created successfully' : 'Login successful', {
                user: completeUserData,
                profile: completeUserData,
                token: jwtToken,
                isNewUser
            }, null, isNewUser ? 201 : 200)
        );
        
    } catch (error) {
        console.error('Google callback error:', error);
        
        if (error.message.includes('invalid_grant')) {
            return res.status(400).json(
                createResponse(false, 'Authorization code expired or invalid', null, null, 400)
            );
        }
        
        res.status(500).json(
            createResponse(false, 'OAuth callback failed', null, null, 500)
        );
    }
};

// Logout (optional - mainly for client-side token cleanup)
exports.logout = async (req, res) => {
    try {
        // In JWT-based auth, logout is mainly handled client-side
        // But we can log the action for analytics
        res.json(
            createResponse(true, 'Logged out successfully')
        );
        
    } catch (error) {
        res.status(500).json(
            createResponse(false, 'Logout failed', null, null, 500)
        );
    }
};
