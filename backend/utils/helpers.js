const User = require('../models/User');

// Helper function: Validate username
const validateUsername = (username) => {
    if (!username) return { valid: false, message: 'Username is required' };
    
    if (username.length < 3 || username.length > 20) {
        return { valid: false, message: 'Username must be between 3-20 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers and underscores' };
    }
    
    return { valid: true };
};

// Helper function: Tạo response chuẩn
const createResponse = (success, message, data = null, errors = null, statusCode = null) => {
    const response = { success, message };
    if (data) response.data = data;
    if (errors) response.errors = errors;
    if (statusCode) response.statusCode = statusCode;
    return response;
};

// Helper function: Tạo username ngẫu nhiên không trùng
const generateUniqueUsername = async (hashId) => {
    const baseUsername = `user_${hashId.slice(0, 8)}`;
    let username = baseUsername;
    let counter = 1;
    
    // Kiểm tra xem username đã tồn tại chưa
    while (true) {
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') }
        });
        
        if (!existingUser) {
            break;
        }
        
        // Nếu đã tồn tại, thêm số vào cuối
        username = `${baseUsername}${counter}`;
        counter++;
        
        // Giới hạn số lần thử để tránh vòng lặp vô hạn
        if (counter > 100) {
            username = `${baseUsername}_${Date.now()}`;
            break;
        }
    }
    
    return username.toLowerCase();
};

module.exports = {
    validateUsername,
    createResponse,
    generateUniqueUsername
};