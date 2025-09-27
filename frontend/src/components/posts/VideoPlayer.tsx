// src/components/posts/VideoPlayer.tsx
// VideoPlayer.tsx - 🎥 Custom Video Player Component với tối ưu hóa hiệu suất
import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { throttle } from 'lodash-es';

interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
  autoPlayWithSound?: boolean;
  poster?: string;
  lazyLoad: boolean;
  preload: 'auto' | 'metadata' | 'none';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = memo(({ 
  videoUrl, 
  className,
  autoPlayWithSound = false,
  poster,
  lazyLoad = true,
  preload = 'metadata'
}) => {
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(!autoPlayWithSound);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userInteractedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Xử lý URL tương tự như ảnh - memoized
  const fullVideoUrl = useMemo(() => {
    if (videoUrl.startsWith('http')) return videoUrl;
    return `${window.location.protocol}//${window.location.hostname}:5000${videoUrl}`;
  }, [videoUrl]);

  // Tối ưu hóa: Sử dụng Intersection Observer với requestIdleCallback
  useEffect(() => {
    if (!lazyLoad) return;
    
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      if (isMuted && autoPlayWithSound) {
        videoEl.muted = false;
        setIsMuted(false);
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    // Sử dụng requestIdleCallback để tránh chặn main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setupIntersectionObserver(videoEl);
      });
    } else {
      setTimeout(() => setupIntersectionObserver(videoEl), 500);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isMuted, autoPlayWithSound, lazyLoad]);

  const setupIntersectionObserver = (videoEl: HTMLVideoElement) => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Sử dụng requestAnimationFrame để tránh jank
            requestAnimationFrame(() => {
              if (isMuted || userInteractedRef.current) {
                playVideoWithFallback();
              }
            });
          } else {
            // Tạm dừng video khi không nhìn thấy để tiết kiệm tài nguyên
            if (!videoEl.paused) {
              videoEl.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: lazyLoad ? '50px' : '0px' // Tải trước 50px khi lazy load
      }
    );

    observerRef.current.observe(videoEl);
  };

  const playVideoWithFallback = useCallback(async () => {
 const videoEl = videoRef.current;
if (!videoEl || videoEl.readyState < 2) {
  setIsLoading(true);

  const onCanPlay = () => {
    if (!videoEl) return; // tránh null
    videoEl.removeEventListener('canplay', onCanPlay);
    attemptPlay();
  };

  videoEl?.addEventListener('canplay', onCanPlay);
  return;
}

    
    await attemptPlay();
  }, []);

  const attemptPlay = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    try {
      await videoEl.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.log('Autoplay failed:', error);
      if (!isMuted) {
        videoEl.muted = true;
        setIsMuted(true);
        try {
          await videoEl.play();
          setIsPlaying(true);
        } catch {
          console.log('Autoplay with mute also failed');
        }
      }
      setIsLoading(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  }, []);

  // Tối ưu hóa: Sử dụng throttle cho sự kiện scroll/resize
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    const throttledVisibilityHandler = throttle(handleVisibilityChange, 200);
    document.addEventListener('visibilitychange', throttledVisibilityHandler);

    return () => {
      document.removeEventListener('visibilitychange', throttledVisibilityHandler);
    };
  }, []);

  // Preload hiệu quả dựa trên kết nối mạng
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.saveData || connection.effectiveType === 'slow-2g') {
        videoEl.preload = 'none';
        return;
      }
    }

    videoEl.preload = preload;
  }, [preload]);

  if (error) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <p>Không thể tải video</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={className}
        muted={isMuted}
        playsInline
        controls
        onError={() => setError(true)}
        poster={poster}
        preload={preload}
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src={fullVideoUrl} type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ video.
      </video>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Custom mute button */}
      <button 
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10"
        onClick={toggleMute}
        aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {isMuted ? '🔇' : '🔈'}
      </button>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';