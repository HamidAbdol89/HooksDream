// StoryContent.tsx - Story media content display with React Spring
import React from 'react';
import { useSpring, animated, useTransition } from '@react-spring/web';
import { REACTION_TYPES } from '@/types/story';
import { StoryContentProps } from './types';

export const StoryContent: React.FC<StoryContentProps> = ({
  story,
  mediaAspectRatio,
  isMuted,
  onVideoLoadedMetadata,
  onVideoTimeUpdate,
  onImageLoad,
  videoRef,
  imageRef
}) => {
  // Get media container classes based on aspect ratio
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

  // Get media element classes
  const getMediaClasses = () => {
    switch (mediaAspectRatio) {
      case 'landscape':
        return "w-full h-auto max-h-full object-contain"; // Fit width, maintain aspect ratio
      case 'portrait':
        return "w-full h-full object-cover"; // Full screen cover for portrait
      case 'square':
        return "max-w-full max-h-full object-contain"; // Fit both dimensions
      default:
        return "w-full h-full object-cover"; // Default fallback
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      onVideoLoadedMetadata();
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      onVideoTimeUpdate();
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      onImageLoad();
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
      className="relative w-full h-full"
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
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedData={() => {}}
            onPlay={() => {}}
            onPause={() => {}}
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
      
      {/* Reactions Display with React Spring */}
      {useTransition(story.reactions.slice(-5), {
        from: { scale: 0, opacity: 0, transform: 'translate(-50%, -50%) rotate(180deg)' },
        enter: { scale: 1, opacity: 1, transform: 'translate(-50%, -50%) rotate(0deg)' },
        leave: { scale: 0, opacity: 0, transform: 'translate(-50%, -50%) rotate(-180deg)' },
        config: {
          tension: 400,
          friction: 25,
          mass: 0.5
        }
      })((style, reaction, _, index) => (
        <animated.div
          key={`${reaction._id}-${index}`}
          style={{
            ...style,
            position: 'absolute',
            left: `${reaction.position.x}%`,
            top: `${reaction.position.y}%`,
            pointerEvents: 'none',
            fontSize: '1.5rem'
          }}
        >
          {REACTION_TYPES.find(r => r.type === reaction.type)?.emoji}
        </animated.div>
      ))}
    </animated.div>
  );
};
