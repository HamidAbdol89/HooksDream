// src/components/feed/CachedVideo.tsx - Optimized Video Component with Caching
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Video, Loader2 } from 'lucide-react';

interface CachedVideoProps {
  src: string;
  className?: string;
  fallbackClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
}

// Global video cache for metadata
const videoCache = new Map<string, {
  duration: number;
  poster?: string;
  canPlay: boolean;
}>();

export const CachedVideo: React.FC<CachedVideoProps> = ({
  src,
  className = '',
  fallbackClassName = '',
  onLoad,
  onError,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  poster
}) => {
  const [videoState, setVideoState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(!autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle video loading
  const handleLoadedMetadata = useCallback(() => {
    if (!mountedRef.current || !videoRef.current) return;
    
    const video = videoRef.current;
    
    // Cache video metadata
    videoCache.set(src, {
      duration: video.duration,
      poster: poster,
      canPlay: true
    });
    
    setVideoState('loaded');
    onLoad?.();
  }, [src, poster, onLoad]);

  const handleError = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.warn('CachedVideo failed to load:', src);
    setVideoState('error');
    onError?.();
  }, [src, onError]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setShowPlayButton(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setShowPlayButton(true);
  }, []);

  const handlePlayButtonClick = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  // Check cache on mount
  useEffect(() => {
    const cached = videoCache.get(src);
    if (cached?.canPlay) {
      setVideoState('loaded');
    }
  }, [src]);

  // Loading state
  if (videoState === 'loading') {
    return (
      <div className={`${className} ${fallbackClassName} flex items-center justify-center bg-black/5 relative`}>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mb-4 relative">
            <Video className="w-8 h-8 text-black/40" />
            <Loader2 className="w-6 h-6 text-black/60 animate-spin absolute" />
          </div>
          <p className="text-black/60 text-sm font-medium">
            Đang tải video...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (videoState === 'error') {
    return (
      <div className={`${className} ${fallbackClassName} flex items-center justify-center bg-black/5`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-black/10 rounded-2xl flex items-center justify-center">
            <Video className="w-8 h-8 text-black/40" />
          </div>
          <p className="text-black/60 text-sm font-medium">
            Không thể tải video
          </p>
        </div>
      </div>
    );
  }

  // Loaded state
  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black"
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload={preload}
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        style={{
          // Prevent layout shift
          minHeight: '200px',
        }}
      />
      
      {/* Custom play button overlay */}
      {showPlayButton && !controls && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={handlePlayButtonClick}
        >
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Loading overlay for buffering */}
      {isPlaying && videoRef.current && videoRef.current.readyState < 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

// Hook for video preloading and cache management
export const useVideoCache = () => {
  const preloadVideoMetadata = useCallback((urls: string[]) => {
    urls.forEach(url => {
      if (url && !videoCache.has(url)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        
        video.addEventListener('loadedmetadata', () => {
          videoCache.set(url, {
            duration: video.duration,
            canPlay: true
          });
        });
        
        video.addEventListener('error', () => {
          // Don't cache failed videos
        });
      }
    });
  }, []);

  const clearVideoCache = useCallback(() => {
    videoCache.clear();
  }, []);

  const getVideoCacheStats = useCallback(() => {
    return {
      cachedVideos: videoCache.size
    };
  }, []);

  return {
    preloadVideoMetadata,
    clearVideoCache,
    getVideoCacheStats
  };
};

export default CachedVideo;
