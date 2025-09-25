// src/components/posts/PostMedia.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Camera, Play } from 'lucide-react';
import  {VideoPlayer}  from './VideoPlayer';
import { useTranslation } from "react-i18next";
import { isMobile } from 'react-device-detect';

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSquare: boolean;
}

interface PostMediaProps {
  images?: string[];
  video?: string;
  content: string;
  onImageClick: (images: string[], index: number) => void;
}

// Thuật toán phân chia layout thông minh với cache
const calculateOptimalLayout = (dimensions: ImageDimensions[], count: number) => {
  if (count === 0) return 'grid-default';
  
  // Kiểm tra nếu dimensions chưa sẵn sàng
  if (dimensions.length === 0 || dimensions.some(dim => !dim || dim.width === 1)) {
    if (count === 1) return 'single-square';
    if (count === 2) return 'two-mixed';
    if (count === 3) return 'three-mixed';
    return 'masonry-grid';
  }

  if (count === 1) {
    const dim = dimensions[0];
    if (dim.isPortrait) return 'single-portrait';
    if (dim.isLandscape) return 'single-landscape';
    return 'single-square';
  }

  if (count === 2) {
    const bothPortrait = dimensions.every(d => d.isPortrait);
    const bothLandscape = dimensions.every(d => d.isLandscape);
    
    if (bothPortrait) return 'two-portrait-side';
    if (bothLandscape) return 'two-landscape-stack';
    return 'two-mixed';
  }

  if (count === 3) {
    const portraits = dimensions.filter(d => d.isPortrait).length;
    const landscapes = dimensions.filter(d => d.isLandscape).length;
    
    if (portraits >= 2) return 'three-portrait-heavy';
    if (landscapes >= 2) return 'three-landscape-heavy';
    return 'three-mixed';
  }

  if (count >= 4) {
    // Tính tổng aspect ratio để xác định layout tốt nhất
    const totalAspectRatio = dimensions.reduce((sum, dim) => sum + dim.aspectRatio, 0);
    const avgAspectRatio = totalAspectRatio / count;
    
    // Nhiều ảnh dọc
    if (avgAspectRatio < 0.9) return 'masonry-portrait';
    
    // Nhiều ảnh ngang
    if (avgAspectRatio > 1.4) return 'masonry-landscape';
    
    // Hỗn hợp
    return 'masonry-grid';
  }

  return 'grid-default';
};

// Cache cho image dimensions để tránh tính toán lại
const imageDimensionsCache = new Map<string, ImageDimensions>();

// Component chính
export const PostMedia: React.FC<PostMediaProps> = ({
  images,
  video,
  content,
  onImageClick
}) => {
  const { t } = useTranslation("common");
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions[]>([]);
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(true);
  const isMobileDevice = isMobile;
  const mobileLayout = isMobileDevice ? 'grid-cols-2 gap-1' : 'grid-cols-3 gap-2';
  const maxDisplayImages = isMobileDevice ? 3 : 4;


  const getImageUrl = useCallback((imagePath: string): string => {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseURL = process.env.REACT_APP_API_URL || 
                   process.env.REACT_APP_BASE_URL || 
                   `${window.location.protocol}//${window.location.hostname}:5000` || 
                   `${window.location.origin}`;
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseURL}/${cleanPath}`;
  }, []);

  const loadImageDimensions = useCallback((src: string): Promise<ImageDimensions> => {
    // Kiểm tra cache trước
    const cached = imageDimensionsCache.get(src);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const dimensions = {
          width: img.width,
          height: img.height,
          aspectRatio,
          isPortrait: aspectRatio < 0.8,
          isLandscape: aspectRatio > 1.3,
          isSquare: aspectRatio >= 0.8 && aspectRatio <= 1.3
        };
        
        // Lưu vào cache
        imageDimensionsCache.set(src, dimensions);
        resolve(dimensions);
      };
      img.onerror = () => {
        // Trả về giá trị mặc định khi có lỗi
        const defaultDimensions = {
          width: 1,
          height: 1,
          aspectRatio: 1,
          isPortrait: false,
          isLandscape: false,
          isSquare: true
        };
        
        // Cache cả giá trị mặc định
        imageDimensionsCache.set(src, defaultDimensions);
        resolve(defaultDimensions);
      };
      img.src = src;
    });
  }, []);

  // Tối ưu: Sử dụng Intersection Observer để lazy load dimensions chỉ khi cần
  useEffect(() => {
    if (images && images.length > 0) {
      setIsLoadingDimensions(true);
      
      // Tạo một AbortController để hủy request nếu component unmount
      const abortController = new AbortController();
      
      // Sử dụng requestIdleCallback để tránh chặn main thread
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          if (abortController.signal.aborted) return;
          
          Promise.all(
            images.map(image => loadImageDimensions(getImageUrl(image)))
          ).then(dimensions => {
            if (!abortController.signal.aborted) {
              setImageDimensions(dimensions);
              setIsLoadingDimensions(false);
            }
          }).catch(() => {
            if (!abortController.signal.aborted) {
              // Nếu có lỗi, set dimensions mặc định
              const defaultDimensions = images.map(() => ({
                width: 1,
                height: 1,
                aspectRatio: 1,
                isPortrait: false,
                isLandscape: false,
                isSquare: true
              }));
              setImageDimensions(defaultDimensions);
              setIsLoadingDimensions(false);
            }
          });
        }, { timeout: 1000 });
      } else {
        // Fallback cho trình duyệt không hỗ trợ
        Promise.all(
          images.map(image => loadImageDimensions(getImageUrl(image)))
        ).then(dimensions => {
          if (!abortController.signal.aborted) {
            setImageDimensions(dimensions);
            setIsLoadingDimensions(false);
          }
        }).catch(() => {
          if (!abortController.signal.aborted) {
            const defaultDimensions = images.map(() => ({
              width: 1,
              height: 1,
              aspectRatio: 1,
              isPortrait: false,
              isLandscape: false,
              isSquare: true
            }));
            setImageDimensions(defaultDimensions);
            setIsLoadingDimensions(false);
          }
        });
      }

      return () => {
        abortController.abort();
      };
    }
  }, [images, getImageUrl, loadImageDimensions]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
  }, []);

  // Sử dụng useMemo để tính toán layout tối ưu
  const optimalLayout = useMemo(() => {
    if (!images || images.length === 0) return null;
    return calculateOptimalLayout(imageDimensions, images.length);
  }, [images, imageDimensions]);

  const renderImageWithErrorHandling = useCallback((image: string, index: number, className: string, alt: string) => {
    if (imageErrors[index]) {
      return (
        <div className={`${className} flex items-center justify-center bg-secondary/30`}>
          <Camera className="w-6 h-6 text-muted-foreground" />
        </div>
      );
    }

    return (
      <img
        src={getImageUrl(image)}
        alt={alt}
        className={`${className} transition-all duration-500 ease-out group-hover:scale-[1.01] group-hover:brightness-105`}
        onClick={() => onImageClick(images!, index)}
        onError={() => handleImageError(index)}
        loading="lazy"
        decoding="async" // Tối ưu decoding
      />
    );
  }, [imageErrors, getImageUrl, images, onImageClick, handleImageError]);

  // Tối ưu: Preconnect đến domain của media
  useEffect(() => {
    if (images && images.length > 0) {
      const firstImageUrl = getImageUrl(images[0]);
      try {
        const url = new URL(firstImageUrl);
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url.origin;
        document.head.appendChild(link);
        
        return () => {
          document.head.removeChild(link);
        };
      } catch (e) {
        console.warn('Could not preconnect to media domain', e);
      }
    }
  }, [images, getImageUrl]);

  if (!images && !video) return null;

  // Video content với VideoPlayer đã tối ưu
  if (video) {
    return (
<div className="relative group/video rounded-xl overflow-hidden bg-black">
  <VideoPlayer 
    videoUrl={video}
    className="w-full aspect-[4/5] md:aspect-video object-cover"
    autoPlayWithSound={false}
    poster={images && images.length > 0 ? getImageUrl(images[0]) : undefined}
    lazyLoad={true}
    preload="metadata"
  />
</div>



    );
  }

  // Image content
  if (images && images.length > 0) {
    const imageCount = images.length;
    
    // Show loading state while dimensions are being calculated
    if (isLoadingDimensions && imageCount > 1) {
      return (
        <div className="relative rounded-xl overflow-hidden bg-secondary/20 animate-pulse">
          <div className="w-full h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/60 rounded-2xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm">Đang tải...</p>
            </div>
          </div>
        </div>
      );
    }

    // Single image with smart sizing
    if (imageCount === 1) {
      const isPortrait = imageDimensions[0]?.isPortrait;
      const isLandscape = imageDimensions[0]?.isLandscape;
      
      return (
        <div className="relative rounded-xl overflow-hidden bg-secondary/20 group cursor-pointer">
          {renderImageWithErrorHandling(
            images[0],
            0,
            `w-full object-contain ${
              isPortrait 
                ? 'max-h-[700px] min-h-[400px]' 
                : isLandscape 
                ? 'max-h-[500px] min-h-[300px]' 
                : 'max-h-[600px] min-h-[400px]'
            }`,
            content || "Post image"
          )}
        </div>
      );
    }

    // Multiple images with smart layout
    return (
      <div className={`grid gap-1 rounded-xl overflow-hidden ${
        optimalLayout === 'masonry-portrait' ? 'grid-cols-2' :
        optimalLayout === 'masonry-landscape' ? 'grid-cols-1' :
        optimalLayout === 'masonry-grid' ? 'grid-cols-2 md:grid-cols-3' :
        'grid-cols-2'
      }`}
      style={{
        // Sử dụng masonry layout nếu trình duyệt hỗ trợ
        gridTemplateRows: 'masonry'
      }}>
{images.slice(0, maxDisplayImages).map((image, index) => (
          <div
            key={index}
            className={`relative bg-secondary/20 group cursor-pointer overflow-hidden ${
              optimalLayout === 'masonry-portrait' && index === 0 ? 'row-span-2' :
              optimalLayout === 'masonry-landscape' ? 'aspect-video' :
              'aspect-square'
            }`}
          >
            {renderImageWithErrorHandling(
              image,
              index,
              'w-full h-full object-cover',
              `Image ${index + 1} - ${content}`
            )}
            
            {/* Hiển thị số ảnh còn lại trên ảnh cuối cùng */}
            {index === 3 && imageCount > 4 && (
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-500 hover:bg-black/70 hover:backdrop-blur-md"
                onClick={() => onImageClick(images, index)}
              >
                <div className="text-white text-center">
                  <div className="text-2xl font-bold mb-1">+{imageCount - 4}</div>
                  <div className="text-xs opacity-90">ảnh khác</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
};