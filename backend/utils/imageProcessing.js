const sharp = require('sharp');

// Helper function: Tối ưu ảnh với Sharp
const optimizeImage = async (buffer, type = 'avatar') => {
    let width, height, quality;
    
    if (type === 'avatar') {
        width = 400;
        height = 400;
        quality = 90;
    } else if (type === 'cover') {
        width = 1200;
        height = 400;
        quality = 85;
    }
    
    return await sharp(buffer)
        .resize(width, height, { 
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ 
            quality,
            progressive: true,
            mozjpeg: true
        })
        .toBuffer();
};

module.exports = {
    optimizeImage
};