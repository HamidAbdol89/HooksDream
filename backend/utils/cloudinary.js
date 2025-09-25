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
    // Trả về kết quả giả để không break existing code
    return { 
      result: 'disabled',
      message: 'Auto-delete disabled for user safety',
      url: imageUrl
    };

  } catch (err) {
    return { result: 'disabled', error: err.message };
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'uploads/videos' : 'uploads/images';
    const resourceType = isVideo ? 'video' : 'image';
    
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
      const error = new Error(`File type not supported: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // ✅ SỬA: Field-specific validation với better logic
    if (file.fieldname === 'images' && !allowedImageTypes.includes(file.mimetype)) {
      const error = new Error('Images field only accepts image files');
      error.code = 'INVALID_IMAGE_TYPE';
      return cb(error, false);
    }

    if (file.fieldname === 'video' && !allowedVideoTypes.includes(file.mimetype)) {
      const error = new Error('Video field only accepts video files');
      error.code = 'INVALID_VIDEO_TYPE';
      return cb(error, false);
    }

    // ✅ THÊM: Cho phép mixed content cho images field (nếu cần)
    // Nếu frontend gửi video vào images field, có thể accept
    if (file.fieldname === 'images' && allowedVideoTypes.includes(file.mimetype)) {
      }

    cb(null, true);
  }
});

const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    return true;
  } catch (error) {
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