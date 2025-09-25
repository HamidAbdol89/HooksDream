const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const stream = require('stream');

const uploadImageToCloudinary = async (fileBuffer, options = {}) => {
  const result = await uploadFromBuffer(fileBuffer, options);
  return result.secure_url;
};

const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // ✅ TẮT AUTO DELETE - CHỈ LOG
    console.log('🚫 AUTO DELETE DISABLED - Would delete:', imageUrl);
    console.log('ℹ️ Image deletion is turned OFF for safety');
    
    // Trả về kết quả giả để không break existing code
    return { 
      result: 'disabled',
      message: 'Auto-delete disabled for user safety',
      url: imageUrl
    };

  } catch (err) {
    console.error('⚠️ Cloudinary delete function called but disabled:', err);
    return { result: 'disabled', error: err.message };
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('☁️ Cloudinary Config Status:');
console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'PRESENT' : 'MISSING');
console.log('- API Key:', process.env.CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING');
console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    console.log('🔍 Cloudinary storage params for:', {
      fieldname: file.fieldname, // ✅ THÊM: Debug field name
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'uploads/videos' : 'uploads/images';
    const resourceType = isVideo ? 'video' : 'image';
    
    console.log('📂 Using folder:', folder);
    console.log('🔧 Resource type:', resourceType);
    
    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      format: isVideo ? undefined : 'jpg', // ✅ SỬA: Không force format cho video
      quality: isVideo ? undefined : 'auto:good', // ✅ SỬA: Không set quality cho video
    };
  }
});

const uploadFromBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10,
    fieldNameSize: 300,
    fieldSize: 1024 * 1024 * 2
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp'
    ];

    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/quicktime', // ✅ THÊM: Hỗ trợ .mov files
      'video/x-msvideo'  // ✅ THÊM: Hỗ trợ .avi files
    ];

    const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allAllowed.includes(file.mimetype)) {
      console.log('❌ File type rejected:', file.mimetype);
      const error = new Error(`File type not supported: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // ✅ SỬA: Field-specific validation với better logic
    if (file.fieldname === 'images' && !allowedImageTypes.includes(file.mimetype)) {
      console.log('❌ Images field but not image type:', file.mimetype);
      const error = new Error('Images field only accepts image files');
      error.code = 'INVALID_IMAGE_TYPE';
      return cb(error, false);
    }

    if (file.fieldname === 'video' && !allowedVideoTypes.includes(file.mimetype)) {
      console.log('❌ Video field but not video type:', file.mimetype);
      const error = new Error('Video field only accepts video files');
      error.code = 'INVALID_VIDEO_TYPE';
      return cb(error, false);
    }

    // ✅ THÊM: Cho phép mixed content cho images field (nếu cần)
    // Nếu frontend gửi video vào images field, có thể accept
    if (file.fieldname === 'images' && allowedVideoTypes.includes(file.mimetype)) {
      console.log('⚠️ Video file in images field - allowing...');
    }

    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  }
});

const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection test passed:', result.status);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection test failed:', {
      message: error.message,
      http_code: error.http_code || 'UNKNOWN'
    });
    return false;
  }
};

testConnection();

module.exports = { 
  upload, 
  cloudinary,
  uploadFromBuffer, 
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  testConnection 
};