const { upload } = require('../utils/cloudinary');
const { createResponse } = require('../utils/helpers');

const videoMimeTypes = [
  'video/mp4',
  'video/mkv', 
  'video/avi',
  'video/mov',
  'video/webm',
  'video/quicktime' // 
];

// Upload ảnh (tối đa 10 ảnh)
exports.uploadImages = (req, res) => {
  // : Sử dụng middleware upload với field 'images'
  const imageUpload = upload.array('images', 10);
  
  imageUpload(req, res, async (err) => {
    try {
      if (err) {
        console.error(' Upload middleware error:', err);
        throw err;
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }
      
      console.log(' Files uploaded:', req.files.length);
      
      const urls = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      }));
      
      res.json({ 
        success: true, 
        data: urls 
      });
      
    } catch (error) {
      console.error(' Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message.includes('File too large') 
          ? 'File size exceeds limit (100MB)' 
          : `Upload failed: ${error.message}`
      });
    }
  });
};

// Upload single image
exports.uploadImage = (req, res) => {
  const imageUpload = upload.single('image');
  
  imageUpload(req, res, async (err) => {
    try {
      if (err) {
        console.error(' Single image upload middleware error:', err);
        throw err;
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image uploaded' 
        });
      }
      
      console.log(' Single image uploaded:', req.file.originalname);
      
      res.json({ 
        success: true, 
        data: {
          url: req.file.path,
          type: 'image'
        }
      });
      
    } catch (error) {
      console.error(' Single image upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message.includes('File too large') 
          ? 'File size exceeds limit (100MB)' 
          : `Upload failed: ${error.message}`
      });
    }
  });
};

// Upload video (1 video)  
exports.uploadVideo = (req, res) => {
  // : Sử dụng middleware upload với field 'video'
  const videoUpload = upload.single('video');
  
  videoUpload(req, res, async (err) => {
    try {
      if (err) {
        console.error('❌ Video upload middleware error:', err);
        throw err;
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No video uploaded' 
        });
      }

      console.log('📹 Video file info:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // ✅ BỎQUA validation này vì đã validate trong multer fileFilter
      // Validation đã được handle trong cloudinary.js fileFilter
      
      res.json({ 
        success: true, 
        data: {
          url: req.file.path,
          type: 'video'
        }
      });
      
    } catch (error) {
      console.error('❌ Video upload error:', error);
      res.status(400).json({
        success: false,
        message: error.code === 'INVALID_VIDEO_TYPE' 
          ? 'Only video files are allowed for video field'
          : error.message
      });
    }
  });
};