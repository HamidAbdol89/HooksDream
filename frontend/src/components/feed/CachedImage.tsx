// src/components/feed/CachedImage.tsx - Optimized Image Component with Caching
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, ImageIcon } from 'lucide-react';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
  srcSet?: string;
}

// Global image cache to prevent re-loading
const imageCache = new Map<string, Promise<string>>();
const loadedImages = new Set<string>();

// Preload image and cache the promise
const preloadImage = (src: string): Promise<string> => {
  if (loadedImages.has(src)) {
    return Promise.resolve(src);
  }

  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const promise = new Promise<string>((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      loadedImages.add(src);
      resolve(src);
    };
    
    img.onerror = () => {
      imageCache.delete(src); // Remove failed attempts from cache
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // Set crossOrigin for CORS images
    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
};

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  sizes,
  srcSet
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load image with caching
  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    // Check if image is already loaded
    if (loadedImages.has(src)) {
      setImageSrc(src);
      setImageState('loaded');
      onLoad?.();
      return;
    }

    setImageState('loading');

    preloadImage(src)
      .then((loadedSrc) => {
        if (!mountedRef.current) return;
        
        setImageSrc(loadedSrc);
        setImageState('loaded');
        onLoad?.();
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        
        console.warn('CachedImage failed to load:', src, error);
        setImageState('error');
        onError?.();
      });
  }, [src, onLoad, onError]);

  const handleImageLoad = useCallback(() => {
    if (!mountedRef.current) return;
    loadedImages.add(src);
    setImageState('loaded');
    onLoad?.();
  }, [src, onLoad]);

  const handleImageError = useCallback(() => {
    if (!mountedRef.current) return;
    setImageState('error');
    onError?.();
  }, [onError]);

  // Loading state
  if (imageState === 'loading') {
    return (
      <div className={`${className} ${fallbackClassName} flex items-center justify-center bg-muted/30 animate-pulse`}>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-16 h-2 bg-muted/50 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (imageState === 'error') {
    return (
      <div className={`${className} ${fallbackClassName} flex items-center justify-center bg-muted/20`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-muted/30 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Không thể tải ảnh
          </p>
        </div>
      </div>
    );
  }

  // Loaded state
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      srcSet={srcSet}
      onLoad={handleImageLoad}
      onError={handleImageError}
      style={{
        // Prevent layout shift
        minHeight: '100px',
        backgroundColor: 'transparent'
      }}
    />
  );
};

// Hook to preload images for better UX
export const useImagePreloader = () => {
  const preloadImages = useCallback((urls: string[]) => {
    urls.forEach(url => {
      if (url && !loadedImages.has(url)) {
        preloadImage(url).catch(() => {
          // Silently handle preload failures
        });
      }
    });
  }, []);

  const clearImageCache = useCallback(() => {
    imageCache.clear();
    loadedImages.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      cachedPromises: imageCache.size,
      loadedImages: loadedImages.size
    };
  }, []);

  return {
    preloadImages,
    clearImageCache,
    getCacheStats
  };
};

export default CachedImage;
