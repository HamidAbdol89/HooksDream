// StoryBubble.tsx - Individual Floating Story Bubble Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story, StoryPosition, STORY_BUBBLE_STYLES, REACTION_TYPES } from '@/types/story';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Play, Volume2, VolumeX, Eye, Heart } from 'lucide-react';

interface StoryBubbleProps {
  story: Story;
  position: StoryPosition;
  isActive?: boolean;
  isDragging?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onDragStart?: (event: React.MouseEvent | React.TouchEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  storyCount?: number; // Number of stories for this user
}

export const StoryBubble: React.FC<StoryBubbleProps> = ({
  story,
  position,
  isActive = false,
  isDragging = false,
  onClick,
  onDragStart,
  className = '',
  style = {},
  storyCount = 1
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Calculate bubble size based on story engagement and recency
  const calculateBubbleSize = () => {
    const baseSize = 60; // Smaller base size for better density
    const engagementBonus = Math.min(15, (story.viewCount + story.reactions.length) * 1.5); // Reduced bonus
    const recencyBonus = Math.max(0, 10 - (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60)); // Smaller recency bonus
    return Math.min(baseSize + engagementBonus + recencyBonus, 85); // Max size cap at 85px
  };

  const bubbleSize = calculateBubbleSize();

  // Helper functions
  const getTimeRemaining = () => {
    const now = new Date();
    const storyTime = new Date(story.createdAt);
    const diffInHours = Math.floor((now.getTime() - storyTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const getDominantReaction = () => {
    if (story.reactions.length === 0) return null;
    
    const reactionCounts: Record<string, number> = {};
    story.reactions.forEach(reaction => {
      reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
    });
    
    const dominantType = Object.entries(reactionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return REACTION_TYPES.find(r => r.type === dominantType);
  };

  // Content items to cycle through
  const contentItems = [
    { type: 'avatar', data: story.userId },
    { type: 'time', data: getTimeRemaining() },
    ...(story.reactions.length > 0 ? [{ type: 'reactions', data: { count: story.reactions.length, emoji: getDominantReaction()?.emoji } }] : []),
    ...(story.viewCount > 0 ? [{ type: 'views', data: story.viewCount }] : [])
  ];

  // Auto-cycle content every 2 seconds
  useEffect(() => {
    if (contentItems.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentContentIndex(prev => (prev + 1) % contentItems.length);
      }, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [contentItems.length]);

  // Pause cycling on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (contentItems.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentContentIndex(prev => (prev + 1) % contentItems.length);
      }, 2000);
    }
  };

  // Generate user-specific badge color
  const getBadgeColor = () => {
    const userId = story.userId._id;
    const colors = [
      '#9333ea', // Purple
      '#dc2626', // Red
      '#ea580c', // Orange
      '#ca8a04', // Yellow
      '#16a34a', // Green
      '#0891b2', // Cyan
      '#2563eb', // Blue
      '#7c3aed', // Violet
      '#be185d', // Pink
      '#059669', // Emerald
    ];
    
    // Use userId to consistently pick same color for same user
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get bubble style based on visual effects
  const getBubbleStyle = () => {
    const baseStyle = STORY_BUBBLE_STYLES[story.visualEffects.bubbleStyle];
    const colorTheme = story.visualEffects.colorTheme;
    
    let customStyle: React.CSSProperties = { ...baseStyle };
    
    // Apply color theme
    if (story.visualEffects.bubbleStyle === 'gradient') {
      customStyle.background = `linear-gradient(135deg, ${colorTheme.primary}, ${colorTheme.secondary})`;
    } else if (story.visualEffects.bubbleStyle === 'neon') {
      customStyle.borderColor = colorTheme.accent;
    }
    
    return customStyle;
  };


  const dominantReaction = getDominantReaction();

  return (
    <>
    <motion.div
      ref={bubbleRef}
      className={`story-bubble rounded-full overflow-hidden ${className} ${storyCount > 1 ? 'has-badge' : ''}`}
      data-count={storyCount > 1 ? storyCount : undefined}
      style={{
        width: `${bubbleSize}px`,
        height: `${bubbleSize}px`,
        ...getBubbleStyle(),
        ...style,
        animation: `${story.visualEffects.animation} ${
          story.visualEffects.animation === 'rotate' ? '10s' : 
          story.visualEffects.animation === 'pulse' ? '2s' : 
          story.visualEffects.animation === 'bounce' ? '2s' : 
          story.visualEffects.animation === 'wave' ? '4s' : '6s'
        } ease-in-out infinite`,
        animationPlayState: isDragging ? 'paused' : 'running'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.1 : 1, 
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.1
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={(e) => {
        // Only start drag on long press or when dragging is intended
        const startTime = Date.now();
        const startDrag = () => {
          if (Date.now() - startTime > 150 && onDragStart) { // 150ms delay for drag
            onDragStart(e);
          }
        };
        setTimeout(startDrag, 150);
      }}
      onTouchStart={(e) => {
        // Record touch start for gesture detection
        const touch = e.touches[0];
        const startTime = Date.now();
        const startPos = { x: touch.clientX, y: touch.clientY };
        
        setTouchStartTime(startTime);
        setTouchStartPos(startPos);
        
        // Don't prevent default - let browser handle scrolling
        // Use a ref to track if we should start dragging
        let shouldStartDrag = true;
        
        const dragTimeout = setTimeout(() => {
          if (shouldStartDrag && onDragStart) {
            onDragStart(e);
          }
        }, 150);
        
        // Store timeout ID to clear it if needed
        const timeoutId = dragTimeout;
        
        // Clear timeout on touch end/cancel
        const cleanup = () => {
          clearTimeout(timeoutId);
          shouldStartDrag = false;
        };
        
        // Add temporary listeners to detect scroll gestures
        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentTouch = moveEvent.touches[0];
          if (currentTouch) {
            const deltaX = Math.abs(currentTouch.clientX - startPos.x);
            const deltaY = Math.abs(currentTouch.clientY - startPos.y);
            const timeDelta = Date.now() - startTime;
            
            // If significant movement (especially vertical) in short time, cancel drag
            if ((deltaY > 15 || deltaX > 15) && timeDelta < 200) {
              shouldStartDrag = false;
              clearTimeout(timeoutId);
            }
          }
        };
        
        const handleTouchEnd = () => {
          cleanup();
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
          document.removeEventListener('touchcancel', handleTouchEnd);
        };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      }}
    >
      {/* Story Content */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-clip-padding">
        {/* Background Media */}
        {story.media.type === 'image' && story.media.url && (
          <img
            src={story.media.url}
            alt="Story content"
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            style={{ 
              filter: `blur(${imageLoaded ? 0 : 10}px)`,
              transition: 'filter 0.3s ease'
            }}
          />
        )}
        
        {story.media.type === 'video' && story.media.url && (
          <video
            src={story.media.url}
            className="w-full h-full object-cover"
            muted={videoMuted}
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        )}
        
        {story.media.type === 'text' && (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-medium text-center p-3"
            style={{ 
              background: `linear-gradient(135deg, ${story.visualEffects.colorTheme.primary}, ${story.visualEffects.colorTheme.secondary})`,
              fontSize: `${Math.max(10, bubbleSize / 10)}px`
            }}
          >
            {/* Truncate long text */}
            {story.content.length > 30 ? `${story.content.substring(0, 30)}...` : story.content}
          </div>
        )}
        

        {/* Clean Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Motion Content Carousel - Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentContentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center"
            >
              {contentItems[currentContentIndex]?.type === 'avatar' && (
                <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                  <AvatarImage src={story.userId.avatar} alt={story.userId.displayName} />
                  <AvatarFallback className="text-sm font-medium">{story.userId.displayName[0]}</AvatarFallback>
                </Avatar>
              )}
              
              {contentItems[currentContentIndex]?.type === 'time' && (
                <div className="bg-black/70 rounded-full px-3 py-1.5">
                  <span className="text-white text-sm font-medium">{String(contentItems[currentContentIndex].data)}</span>
                </div>
              )}
              
              {contentItems[currentContentIndex]?.type === 'reactions' && (
                <div className="bg-black/70 rounded-full px-3 py-1.5 flex items-center space-x-1">
                  <span className="text-lg">{(contentItems[currentContentIndex].data as any)?.emoji}</span>
                  <span className="text-white text-sm font-medium">{(contentItems[currentContentIndex].data as any)?.count}</span>
                </div>
              )}
              
              {contentItems[currentContentIndex]?.type === 'views' && (
                <div className="bg-black/70 rounded-full px-3 py-1.5 flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">{String(contentItems[currentContentIndex].data)}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Video Play Indicator - Bottom Corner */}
        {story.media.type === 'video' && (
          <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
            <Play className="w-2 h-2 text-white" />
          </div>
        )}
        
        {/* Viewed Indicator */}
        {story.hasViewed && (
          <div className="absolute inset-0 border-2 border-gray-400 rounded-full opacity-60" />
        )}
        
        {/* Active/Selected Indicator */}
        {isActive && (
          <motion.div
            className="absolute inset-0 border-3 border-white rounded-full"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        
        {/* Story Count Badge - Inside Bubble */}
        {storyCount > 1 && (
          <motion.div
            className="absolute top-1 right-1 rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: getBadgeColor(),
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 15,
              duration: 0.3
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white text-xs font-bold leading-none">{storyCount}</span>
          </motion.div>
        )}
      </div>
      
      
      {/* Particle Effects for Reactions */}
      <AnimatePresence>
        {story.reactions.slice(-3).map((reaction, index) => (
          <motion.div
            key={`${reaction._id}-${index}`}
            initial={{ 
              scale: 0,
              opacity: 1 
            }}
            animate={{ 
              scale: [0, 1.5, 1], 
              y: [
                -bubbleSize * 0.1, 
                -bubbleSize * 0.4, 
                -bubbleSize * 0.7
              ], // Responsive bounce up animation
              x: [
                (index - 1) * (bubbleSize * 0.15), 
                (index - 1) * (bubbleSize * 0.25)
              ], // Responsive horizontal spread
              opacity: [1, 1, 0.8, 0] 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut", delay: index * 0.1 }}
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: '50%', // Center of bubble
              top: '50%',  // Center of bubble
              fontSize: `${Math.max(12, bubbleSize * 0.25)}px` // Responsive font size based on bubble size
            }}
          >
            {REACTION_TYPES.find(r => r.type === reaction.type)?.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
    
  </>
  );
};
