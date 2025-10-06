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
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return { result: 'skipped', message: 'Not a Cloudinary URL' };
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return { result: 'error', message: 'Invalid Cloudinary URL format' };
    }

    // Get everything after 'upload/v1234567890/' or 'upload/'
    let publicIdWithExtension = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove version if present (v1234567890)
    if (publicIdWithExtension.startsWith('v') && /^v\d+\//.test(publicIdWithExtension)) {
      publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
    }
    
    // Remove file extension
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true // Clear CDN cache
    });

    if (result.result === 'ok') {
      return { result: 'success', publicId, message: 'Image deleted successfully' };
    } else {
      return { result: result.result, publicId, message: `Delete result: ${result.result}` };
    }

  } catch (err) {
    console.error('❌ Error deleting from Cloudinary:', err);
    return { result: 'error', error: err.message };
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
    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/');
    
    let folder, resourceType;
    
    // Check if this is a bot post by looking at request body or headers
    const isBot = req.body?.isBot === 'true' || req.body?.bot_metadata || req.headers['x-bot-user'];
    const botUsername = req.body?.botUsername || req.headers['x-bot-username'];
    
    if (isVideo) {
      if (isBot && botUsername) {
        folder = `bots/${botUsername}/videos`;
      } else {
        folder = 'uploads/videos';
      }
      resourceType = 'video';
    } else if (isImage) {
      if (isBot && botUsername) {
        folder = `bots/${botUsername}/posts`;
      } else {
        folder = 'uploads/images';
      }
      resourceType = 'image';
    } else if (isAudio) {
      if (isBot && botUsername) {
        folder = `bots/${botUsername}/audio`;
      } else {
        folder = 'uploads/audio';
      }
      resourceType = 'video'; // Cloudinary treats audio as video resource type
    } else {
      // For documents and other files
      if (isBot && botUsername) {
        folder = `bots/${botUsername}/files`;
      } else {
        folder = 'uploads/files';
      }
      resourceType = 'raw'; // Raw resource type for documents
    }
    
    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      format: isImage ? 'jpg' : undefined, // Only format images
      quality: isImage ? 'auto:good' : undefined, // Only quality for images
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
      'video/quicktime',
      'video/x-msvideo'
    ];

    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg'
    ];

    const allowedFileTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      // Other
      'application/json',
      'application/xml',
      'text/xml'
    ];

    const allAllowed = [...allowedImageTypes, ...allowedVideoTypes, ...allowedAudioTypes, ...allowedFileTypes];

    // Field-specific validation
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

    if (file.fieldname === 'audio' && !allowedAudioTypes.includes(file.mimetype)) {
      const error = new Error('Audio field only accepts audio files');
      error.code = 'INVALID_AUDIO_TYPE';
      return cb(error, false);
    }

    if (file.fieldname === 'file' && !allAllowed.includes(file.mimetype)) {
      const error = new Error(`File type not supported: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // General validation for other fields
    if (!allAllowed.includes(file.mimetype)) {
      const error = new Error(`File type not supported: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
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