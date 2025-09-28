// src/components/posts/OptimizedImage.tsx
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Camera } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  className = '',
  onClick,
  onError,
  placeholder,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate WebP and fallback URLs
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
      return originalSrc;
    }
    
    const baseURL = process.env.REACT_APP_API_URL || 
                   process.env.REACT_APP_BASE_URL || 
                   `${window.location.protocol}//${window.location.hostname}:5000` || 
                   `${window.location.origin}`;
    
    const cleanPath = originalSrc.startsWith('/') ? originalSrc.slice(1) : originalSrc;
    return `${baseURL}/${cleanPath}`;
  }, []);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback((baseSrc: string) => {
    const optimizedSrc = getOptimizedSrc(baseSrc);
    
    // Try to generate different sizes if the server supports it
    const widths = [320, 640, 768, 1024, 1280, 1920];
    
    return widths
      .map(width => {
        // If server supports dynamic resizing, use it
        if (optimizedSrc.includes('cloudinary') || optimizedSrc.includes('imagekit')) {
          return `${optimizedSrc}?w=${width} ${width}w`;
        }
        // Otherwise, just use the original image
        return `${optimizedSrc} ${width}w`;
      })
      .join(', ');
  }, [getOptimizedSrc]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedSrc(src);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, getOptimizedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleClick = useCallback(() => {
    if (!hasError) {
      onClick?.();
    }
  }, [onClick, hasError]);

  // Generate blur placeholder
  const blurDataURL = placeholder || 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';

  if (hasError) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-secondary/30 cursor-pointer`}
        onClick={handleClick}
      >
        <Camera className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Blur placeholder */}
      {!isLoaded && (
        <div
          className={`${className} absolute inset-0 bg-cover bg-center filter blur-sm scale-110 transition-opacity duration-300`}
          style={{
            backgroundImage: `url(${blurDataURL})`,
          }}
        />
      )}
      
      {/* Main image */}
      {isInView && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}
            sizes={sizes}
            type="image/webp"
          />
          
          {/* Fallback for older browsers */}
          <img
            ref={imgRef}
            src={getOptimizedSrc(src)}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            alt={alt}
            className={`${className} transition-all duration-500 ease-out ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:brightness-105' : ''}`}
            onClick={handleClick}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>
      )}
      
      {/* Loading state */}
      {!isLoaded && !hasError && isInView && (
        <div className={`${className} absolute inset-0 flex items-center justify-center bg-secondary/20 animate-pulse`}>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
