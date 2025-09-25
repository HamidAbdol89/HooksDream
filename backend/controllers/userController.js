const User = require('../models/User');
const Follow = require('../models/Follow');
const { createResponse, validateUsername, generateUniqueUsername } = require('../utils/helpers');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../utils/cloudinary');
const { optimizeImage } = require('../utils/imageProcessing');

// Lấy thông tin current user profile (từ JWT token)
exports.getCurrentUserProfile = async (req, res) => {
    try {
        // req.user được set bởi authMiddleware
        const userId = req.user._id || req.user.googleId;
        
        const user = await User.findById(userId)
            .select('-__v')
            .lean();
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        // Đây là profile của chính user đó
        const userProfile = {
            ...user,
            isFollowing: false, // Không thể follow chính mình
            isOwnProfile: true
        };
        
        res.json(createResponse(true, 'Current user profile retrieved successfully', userProfile));
        
    } catch (error) {
        console.error('⚠️ Get current user profile error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Lấy thông tin user profile
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.headers.authorization?.replace('Bearer ', '');
        
        const user = await User.findById(userId)
            .select('-__v')
            .lean();
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        // Check if current user is following this user
        let isFollowing = false;
        if (currentUserId) {
            const follow = await Follow.findOne({
                follower: currentUserId,
                following: userId
            });
            isFollowing = !!follow;
        }
        
        // Thêm isFollowing vào response
        const userProfile = {
            ...user,
            isFollowing,
            isOwnProfile: currentUserId === userId
        };
        
        res.json(createResponse(true, 'User profile retrieved successfully', userProfile));
        
    } catch (error) {
        console.error('⚠️ Get profile error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// ✅ SAFE UPDATE: Cập nhật profile KHÔNG XÓA ảnh cũ tự động
exports.updateProfile = async (req, res) => {
    try {
        const { hashId } = req.params;
        const { 
            username, 
            displayName, 
            bio, 
            location,
            website,
            phone,
            pronouns,
        } = req.body;
        
        console.log('📝 Update profile request:', { hashId, username, displayName });
        
        const user = await User.findById(hashId);
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }

        // Validate username nếu có thay đổi
        if (username && username !== user.username) {
            const usernameValidation = validateUsername(username);
            if (!usernameValidation.valid) {
                return res.status(400).json(
                    createResponse(false, usernameValidation.message, null, null, 400)
                );
            }
            
            // Kiểm tra username đã tồn tại
            const existingUser = await User.findOne({ 
                username: username.toLowerCase(),
                _id: { $ne: hashId }
            });
            
            if (existingUser) {
                return res.status(409).json(
                    createResponse(false, 'Username already taken', null, null, 409)
                );
            }
            
            user.username = username.toLowerCase();
        }
        
        // Cập nhật các field text
        if (displayName !== undefined) user.displayName = displayName;
        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (website !== undefined) user.website = website;
        if (phone !== undefined) user.phone = phone;
        if (pronouns !== undefined) user.pronouns = pronouns;
        
        // ✅ UPLOAD ẢNH MỚI - KHÔNG XÓA ẢNH CŨ
        // Xử lý avatar upload (file)
        if (req.files?.avatar) {
            try {
                console.log('🖼️ Processing new avatar...');
                const optimizedAvatar = await optimizeImage(req.files.avatar[0].buffer, 'avatar');
                
                const newAvatarUrl = await uploadImageToCloudinary(optimizedAvatar, {
                    folder: 'uploads/images',
                    resource_type: 'image',
                    public_id: `avatar_${hashId}_${Date.now()}`,
                    format: 'jpg',
                    quality: 'auto:good',
                    // Tạo transformations đồng bộ
                    eager: [
                        { width: 200, height: 200, crop: 'fill', format: 'jpg' },
                        { width: 400, height: 400, crop: 'fill', format: 'jpg' }
                    ],
                    eager_async: false,
                    invalidate: true
                });
                
                user.avatar = newAvatarUrl;
                console.log('✅ New avatar uploaded successfully:', newAvatarUrl);
                
                // CDN propagate delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (imgError) {
                console.error('⚠️ Avatar processing error:', imgError);
                return res.status(400).json(
                    createResponse(false, `Avatar processing failed: ${imgError.message}`, null, null, 400)
                );
            }
        }
        
        // Xử lý cover image upload (file)
        if (req.files?.coverImage) {
            try {
                console.log('🖼️ Processing new cover image...');
                const optimizedCover = await optimizeImage(req.files.coverImage[0].buffer, 'cover');
                
                const newCoverUrl = await uploadImageToCloudinary(optimizedCover, {
                    folder: 'uploads/images',
                    resource_type: 'image',
                    public_id: `cover_${hashId}_${Date.now()}`,
                    format: 'jpg',
                    quality: 'auto:good',
                    eager: [
                        { width: 1200, height: 400, crop: 'fill', format: 'jpg' }
                    ],
                    eager_async: false,
                    invalidate: true
                });
                
                user.coverImage = newCoverUrl;
                console.log('✅ New cover image uploaded successfully:', newCoverUrl);
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (imgError) {
                console.error('⚠️ Cover processing error:', imgError);
                return res.status(400).json(
                    createResponse(false, `Cover image processing failed: ${imgError.message}`, null, null, 400)
                );
            }
        }
        
        // ✅ LƯU USER VỚI ẢNH MỚI
        user.updatedAt = new Date();
        await user.save();
        
        console.log('✅ Profile updated successfully - NO AUTO DELETE:', user._id);
        
        // ✅ TRẢ RESPONSE CHO FRONTEND NGAY VỚI CACHE-BUSTING
        const response = createResponse(true, 'Profile updated successfully', {
            ...user.toObject(),
            // Cache-busting URLs
            avatar: user.avatar ? `${user.avatar}?t=${Date.now()}` : user.avatar,
            coverImage: user.coverImage ? `${user.coverImage}?t=${Date.now()}` : user.coverImage,
            _serverTimestamp: Date.now()
        });
        
        res.json(response);
        
        // ✅ CHỈ LOG - KHÔNG XÓA TỰ ĐỘNG
        console.log('ℹ️ Profile update completed safely - old images preserved');
        
    } catch (error) {
        console.error('⚠️ Update profile error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json(
                createResponse(false, `${field} already taken`, null, null, 409)
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

// ✅ MANUAL CLEANUP - Hàm để admin xóa ảnh cũ thủ công khi cần
exports.cleanupOldImages = async (req, res) => {
    try {
        const { hashId } = req.params;
        const { imageUrl } = req.body;
        
        console.log('🗑️ Manual cleanup request:', { hashId, imageUrl });
        
        if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
            return res.status(400).json(
                createResponse(false, 'Invalid image URL', null, null, 400)
            );
        }
        
        // ✅ KIỂM TRA: Đảm bảo URL không phải là ảnh đang dùng
        const user = await User.findById(hashId);
        if (user && (user.avatar === imageUrl || user.coverImage === imageUrl)) {
            return res.status(400).json(
                createResponse(false, 'Cannot delete currently used image', null, null, 400)
            );
        }
        
        const result = await deleteImageFromCloudinary(imageUrl);
        console.log('✅ Manual cleanup successful:', result);
        
        res.json(createResponse(true, 'Image cleaned up successfully', result));
        
    } catch (error) {
        console.error('⚠️ Manual cleanup error:', error);
        res.status(500).json(
            createResponse(false, 'Cleanup failed', null, null, 500)
        );
    }
};

// ✅ BATCH CLEANUP cho admin - xóa nhiều ảnh cũ cùng lúc
exports.batchCleanupImages = async (req, res) => {
    try {
        const { imageUrls } = req.body;
        
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            return res.status(400).json(
                createResponse(false, 'Invalid image URLs array', null, null, 400)
            );
        }
        
        console.log('🗑️ Batch cleanup request:', imageUrls.length, 'images');
        
        const results = [];
        for (const imageUrl of imageUrls) {
            try {
                if (imageUrl && imageUrl.includes('cloudinary.com')) {
                    const result = await deleteImageFromCloudinary(imageUrl);
                    results.push({ url: imageUrl, result: 'success', data: result });
                } else {
                    results.push({ url: imageUrl, result: 'skipped', reason: 'Invalid URL' });
                }
            } catch (err) {
                results.push({ url: imageUrl, result: 'error', error: err.message });
            }
        }
        
        console.log('✅ Batch cleanup completed:', results.length, 'processed');
        
        res.json(createResponse(true, 'Batch cleanup completed', results));
        
    } catch (error) {
        console.error('⚠️ Batch cleanup error:', error);
        res.status(500).json(
            createResponse(false, 'Batch cleanup failed', null, null, 500)
        );
    }
};

// Lấy thống kê user
exports.getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('followerCount followingCount postCount')
            .lean();
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        res.json(createResponse(true, 'User stats retrieved successfully', {
            followers: user.followerCount || 0,
            following: user.followingCount || 0,
            posts: user.postCount || 0
        }));
        
    } catch (error) {
        console.error('⚠️ Get stats error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Lấy danh sách users (có thể dùng để search)
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        
        let query = {};
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { username: searchRegex },
                    { displayName: searchRegex }
                ]
            };
        }
        
        // Tạo sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-email -__v') // Không trả về email trong public API
                .sort(sortObj)
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum)
                .lean(),
            User.countDocuments(query)
        ]);
        
        const totalPages = Math.ceil(total / limitNum);
        
        res.json(createResponse(true, 'Users retrieved successfully', users, null, null, {
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        }));
        
    } catch (error) {
        console.error('⚠️ Get users error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};

// Xóa user (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        const { hashId } = req.params;
        
        const user = await User.findById(hashId);
        
        if (!user) {
            return res.status(404).json(
                createResponse(false, 'User not found', null, null, 404)
            );
        }
        
        // Soft delete - chỉ đánh dấu là deleted
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.updatedAt = new Date();
        await user.save();
        
        console.log('🗑️ User soft deleted:', user._id);
        
        res.json(createResponse(true, 'Account deleted successfully'));
        
    } catch (error) {
        console.error('⚠️ Delete user error:', error);
        res.status(500).json(
            createResponse(false, 'Internal server error', null, null, 500)
        );
    }
};