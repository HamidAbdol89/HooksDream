// src/utils/imageUtils.ts
type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 -> 1
};

export const compressImage = (file: File, options: CompressOptions = {}): Promise<File> => {
  const { maxWidth = 200, maxHeight = 200, quality = 0.8 } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name, { type: file.type }));
      }, file.type, quality);
    };
  });
};
