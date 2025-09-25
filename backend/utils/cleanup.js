require('dotenv').config({ path: '../.env' });
const { cloudinary } = require('./cloudinary');


// Script để cleanup toàn bộ Cloudinary
const cleanupCloudinary = async () => {
  try {
    console.log('🧹 Starting Cloudinary cleanup...');
    
    // Lấy tất cả resources
    const allResources = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500, // Tăng limit
      resource_type: 'image'
    });
    
    console.log(`📊 Found ${allResources.resources.length} images`);
    
    // Lấy danh sách public_ids
    const publicIds = allResources.resources.map(resource => resource.public_id);
    
    if (publicIds.length === 0) {
      console.log('✅ No images to delete');
      return;
    }
    
    // Xóa hàng loạt (tối đa 100 cùng lúc)
    const batchSize = 100;
    for (let i = 0; i < publicIds.length; i += batchSize) {
      const batch = publicIds.slice(i, i + batchSize);
      
      console.log(`🗑️ Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(publicIds.length/batchSize)}`);
      console.log(`   Range: ${i + 1} - ${Math.min(i + batchSize, publicIds.length)}`);
      
      try {
        const result = await cloudinary.api.delete_resources(batch);
        
        console.log(`✅ Batch result:`, {
          deleted: Object.keys(result.deleted).length,
          not_found: Object.keys(result.not_found || {}).length,
          partial: Object.keys(result.partial || {}).length
        });
        
        // In chi tiết các file not_found
        if (result.not_found && Object.keys(result.not_found).length > 0) {
          console.log('❌ Not found files:', Object.keys(result.not_found));
        }
        
      } catch (batchError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
      }
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Cleanup videos nếu có
    console.log('🎥 Checking for videos...');
    const videoResources = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      resource_type: 'video'
    });
    
    if (videoResources.resources.length > 0) {
      console.log(`📊 Found ${videoResources.resources.length} videos`);
      const videoPublicIds = videoResources.resources.map(resource => resource.public_id);
      
      for (let i = 0; i < videoPublicIds.length; i += batchSize) {
        const batch = videoPublicIds.slice(i, i + batchSize);
        
        console.log(`🗑️ Deleting video batch ${Math.floor(i/batchSize) + 1}`);
        
        try {
          await cloudinary.api.delete_resources(batch, { resource_type: 'video' });
          console.log(`✅ Video batch deleted: ${batch.length} files`);
        } catch (batchError) {
          console.error(`❌ Video batch failed:`, batchError.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Cleanup folders rỗng
    console.log('📁 Cleaning up empty folders...');
    try {
      const folders = await cloudinary.api.sub_folders('uploads');
      console.log('Found folders:', folders);
      
      // Xóa folder uploads/images và uploads/videos nếu rỗng
      try {
        await cloudinary.api.delete_folder('uploads/images');
        console.log('✅ Deleted uploads/images folder');
      } catch (err) {
        console.log('ℹ️  uploads/images folder not found or not empty');
      }
      
      try {
        await cloudinary.api.delete_folder('uploads/videos');
        console.log('✅ Deleted uploads/videos folder');
      } catch (err) {
        console.log('ℹ️  uploads/videos folder not found or not empty');
      }
      
    } catch (folderError) {
      console.log('ℹ️  No folders to clean or error:', folderError.message);
    }
    
    console.log('🎉 Cloudinary cleanup completed!');
    
    // Kiểm tra lại
    const finalCheck = await cloudinary.api.resources({
      type: 'upload',
      max_results: 10,
      resource_type: 'image'
    });
    
    console.log(`📊 Remaining images: ${finalCheck.resources.length}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// Function để reset database avatars về default
const resetDatabaseAvatars = async () => {
  // Thay đổi theo database của bạn (MongoDB, MySQL, etc.)
  console.log('🔄 Resetting database avatars...');
  
  //  cho MongoDB:
   await db.collection('users').updateMany(
     { avatar: { $regex: 'cloudinary.com' } },
     { $unset: { avatar: 1 } }
   );
  

  console.log('✅ Database avatars reset completed');
};

// Chạy cleanup
if (require.main === module) {
  cleanupCloudinary()
    .then(() => {
      console.log('✅ All cleanup tasks completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupCloudinary, resetDatabaseAvatars };