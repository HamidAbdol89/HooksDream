// src/components/feed/MediaWithFallback.tsx
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { MediaFallbackProps } from './types';

export const MediaWithFallback: React.FC<MediaFallbackProps> = ({
  mediaPath,
  alt,
  className,
  isVideo = false
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const possibleBaseUrls = [
    process.env.REACT_APP_API_URL,
    'http://localhost:5000',
    `${window.location.protocol}//${window.location.hostname}:5000`,
    window.location.origin,
  ].filter(Boolean);
  
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.slice(1) : mediaPath;
  const currentUrl = `${possibleBaseUrls[currentUrlIndex]}/${cleanPath}`;
  
  // Debug: Log URL generation
  console.log('MediaWithFallback Debug:', {
    mediaPath,
    cleanPath, 
    baseUrl: possibleBaseUrls[currentUrlIndex],
    finalUrl: currentUrl,
    urlIndex: currentUrlIndex
  });
  
  const handleError = () => {
    if (currentUrlIndex < possibleBaseUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };
  
  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/5 dark:bg-white/5`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-black/10 dark:bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Camera className="w-8 h-8 text-black/40 dark:text-white/40" />
          </div>
          <p className="text-black/60 dark:text-white/60 text-sm font-medium">
            {isVideo ? 'Không thể tải video' : 'Không thể tải ảnh'}
          </p>
        </div>
      </div>
    );
  }
  
  return isVideo ? (
    <video
      controls
      src={currentUrl}
      className={className}
      onError={handleError}
      preload="metadata"
    />
  ) : (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
};