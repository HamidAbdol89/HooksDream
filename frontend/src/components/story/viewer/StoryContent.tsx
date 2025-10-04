// StoryContent.tsx - Professional story content with aspect ratio handling
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { REACTION_TYPES } from '@/types/story';
import { StoryContentProps } from './types';

export const StoryContent: React.FC<StoryContentProps> = ({
  story,
  mediaAspectRatio,
  isMuted,
  isPaused,
  onVideoLoadedMetadata,
  onVideoTimeUpdate,
  onImageLoad,
  onPauseToggle,
  onRepliesToggle,
  videoRef,
  imageRef
}) => {
  // Get media container classes based on aspect ratio (original logic)
  const getMediaContainerClasses = () => {
    const baseClasses = "flex items-center justify-center w-full h-full";
    
    switch (mediaAspectRatio) {
      case 'landscape':
        return `${baseClasses} px-0 py-8`; // Add vertical padding for landscape
      case 'portrait':
        return `${baseClasses}`; // Full screen for portrait - no padding
      case 'square':
        return `${baseClasses} p-4`; // Balanced padding for square
      default:
        return baseClasses;
    }
  };

  // Get media element classes - video ngang không bị cắt, video dọc full screen
  const getMediaClasses = () => {
    switch (mediaAspectRatio) {
      case 'landscape':
        return "w-full h-auto max-h-full object-contain"; // Video ngang: hiển thị full, không crop
      case 'portrait':
        return "w-full h-full object-cover"; // Video dọc: full screen
      case 'square':
        return "w-full h-auto max-h-full object-contain"; // Square: contain để không bị crop
      default:
        return "w-full h-auto max-h-full object-contain"; // Default: safe fallback
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      onVideoTimeUpdate(currentTime, duration);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      onVideoLoadedMetadata(videoRef.current);
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      onImageLoad(imageRef.current);
    }
  };

  // React Spring animation for story content
  const contentSpring = useSpring({
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8
    }
  });

  return (
    <animated.div
      key={story._id}
      style={contentSpring}
      className="relative w-full h-full cursor-pointer"
      onClick={(e) => {
        // Don't trigger pause if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea')) return;
        
        // Toggle pause state
        if (story.media.type === 'video' || story.media.type === 'image') {
          onPauseToggle();
          e.stopPropagation();
        }
      }}
    >
      {/* Background Media Container */}
      <div className={getMediaContainerClasses()}>
        {story.media.type === 'image' && story.media.url && (
          <img
            ref={imageRef}
            src={story.media.url}
            alt="Story content"
            className={getMediaClasses()}
            onLoad={handleImageLoad}
          />
        )}
        
        {story.media.type === 'video' && story.media.url && (
          <video
            ref={videoRef}
            src={story.media.url}
            className={getMediaClasses()}
            autoPlay
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleVideoLoadedMetadata}
            onTimeUpdate={() => handleVideoTimeUpdate()}
          />
        )}
        
        {story.media.type === 'text' && (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-bold text-center p-8"
            style={{ 
              background: `linear-gradient(135deg, ${story.visualEffects.colorTheme.primary}, ${story.visualEffects.colorTheme.secondary})`,
              fontSize: 'clamp(1.5rem, 4vw, 3rem)'
            }}
          >
            {story.content}
          </div>
        )}
      </div>
      
      {/* Content Overlay */}
      {story.content && story.media.type !== 'text' && (
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <p className="text-white text-lg">{story.content}</p>
          </div>
        </div>
      )}
      

      {/* Reply Pill Indicator - Only show for story author when has replies */}
      {story.replies && story.replies.length > 0 && story.isOwn && (
        <div className="absolute top-20 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRepliesToggle(); // Open replies dialog and pause
            }}
            className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 text-white hover:bg-black/80 transition-colors"
          >
            <div className="flex -space-x-1">
              {(() => {
                // Get unique users from replies (latest first)
                const uniqueUsers = story.replies
                  .slice()
                  .reverse()
                  .reduce((acc: any[], reply) => {
                    if (!acc.find(user => user.userId._id === reply.userId._id)) {
                      acc.push(reply);
                    }
                    return acc;
                  }, [])
                  .slice(0, 3);

                return uniqueUsers.map((reply, index) => (
                  <img
                    key={reply.userId._id}
                    src={reply.userId.avatar}
                    alt={reply.userId.displayName}
                    className="w-5 h-5 rounded-full border border-white/50"
                    style={{ zIndex: 3 - index }}
                  />
                ));
              })()}
            </div>
            <span className="text-xs font-medium">
              {story.replies.length} {story.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          </button>
        </div>
      )}
    </animated.div>
  );
};
