require('dotenv').config({ path: '../.env' });
const { cloudinary } = require('./cloudinary');


// Script để cleanup toàn bộ Cloudinary
const cleanupCloudinary = async () => {
  try {
    // Lấy tất cả resources
    const allResources = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500, // Tăng limit
      resource_type: 'image'
    });
    
    // Lấy danh sách public_ids
    const publicIds = allResources.resources.map(resource => resource.public_id);
    
    if (publicIds.length === 0) {
      return;
    }
    
    // Xóa hàng loạt (tối đa 100 cùng lúc)
    const batchSize = 100;
    for (let i = 0; i < publicIds.length; i += batchSize) {
      const batch = publicIds.slice(i, i + batchSize);
      
      try {
        const result = await cloudinary.api.delete_resources(batch);
        
        // In chi tiết các file not_found
        if (result.not_found && Object.keys(result.not_found).length > 0) {
          }
        
      } catch (batchError) {
        }
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Cleanup videos nếu có
    const videoResources = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      resource_type: 'video'
    });
    
    if (videoResources.resources.length > 0) {
      const videoPublicIds = videoResources.resources.map(resource => resource.public_id);
      
      for (let i = 0; i < videoPublicIds.length; i += batchSize) {
        const batch = videoPublicIds.slice(i, i + batchSize);
        
        try {
          await cloudinary.api.delete_resources(batch, { resource_type: 'video' });
          } catch (batchError) {
          }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Cleanup folders rỗng
    try {
      const folders = await cloudinary.api.sub_folders('uploads');
      // Xóa folder uploads/images và uploads/videos nếu rỗng
      try {
        await cloudinary.api.delete_folder('uploads/images');
        } catch (err) {
        }
      
      try {
        await cloudinary.api.delete_folder('uploads/videos');
        } catch (err) {
        }
      
    } catch (folderError) {
      }
    
    // Kiểm tra lại
    const finalCheck = await cloudinary.api.resources({
      type: 'upload',
      max_results: 10,
      resource_type: 'image'
    });
    
    } catch (error) {
    throw error;
  }
};

// Function để reset database avatars về default
const resetDatabaseAvatars = async () => {
  // Thay đổi theo database của bạn (MongoDB, MySQL, etc.)
  //  cho MongoDB:
   await db.collection('users').updateMany(
     { avatar: { $regex: 'cloudinary.com' } },
     { $unset: { avatar: 1 } }
   );
  

  };

// Chạy cleanup
if (require.main === module) {
  cleanupCloudinary()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      process.exit(1);
    });
}

module.exports = { cleanupCloudinary, resetDatabaseAvatars };