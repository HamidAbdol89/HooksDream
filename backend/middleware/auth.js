const User = require('../models/User');
const googleAuthService = require('../services/googleAuthService');

// Middleware xác thực user - chỉ JWT tokens
const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header provided'
            });
        }

        // Extract token from header
        const token = googleAuthService.extractTokenFromHeader(authHeader);
            
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify JWT token
        const decoded = googleAuthService.verifyJWTToken(token);
        const userId = decoded.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Gắn user vào request object để các route handler có thể sử dụng
        req.userId = userId;
        
        next();
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware optional - không bắt buộc phải đăng nhập
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader) {
            const token = googleAuthService.extractTokenFromHeader(authHeader);
                
            if (token) {
                try {
                    const decoded = googleAuthService.verifyJWTToken(token);
                    const userId = decoded.userId;
                    const user = await User.findById(userId);
                    
                    if (user) {
                        req.user = user;
                        req.userId = userId;
                    }
                } catch (error) {
                    // Ignore errors in optional auth
                }
            }
        }
        
        next();
        
    } catch (error) {
        next(); // Tiếp tục dù có lỗi
    }
};

// Middleware kiểm tra quyền owner
const requireOwnership = (resourceUserField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // Sẽ được sử dụng trong route handlers để check ownership
        req.checkOwnership = (resource) => {
            return resource[resourceUserField] === req.userId;
        };
        
        next();
    };
};

module.exports = {
    authMiddleware,
    optionalAuth,
    requireOwnership
};
