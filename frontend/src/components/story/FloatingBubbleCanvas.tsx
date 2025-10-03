// FloatingBubbleCanvas.tsx - Innovative 3D Floating Bubble Stories
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story, StoryPosition, FloatingBubbleCanvasProps, STORY_BUBBLE_STYLES, STORY_ANIMATIONS } from '@/types/story';
import { useStoryPhysics } from '@/hooks/useStoryPhysics';
import { StoryBubble } from './StoryBubble';
import { ParticleSystem } from './ParticleSystem';

export const FloatingBubbleCanvas: React.FC<FloatingBubbleCanvasProps> = ({
  stories,
  onStoryClick,
  onPositionUpdate,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const {
    bubbleStates,
    updateBubblePosition,
    startPhysicsSimulation,
    stopPhysicsSimulation,
    resetPhysics
  } = useStoryPhysics(stories);

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    startPhysicsSimulation();
    return () => stopPhysicsSimulation();
  }, [startPhysicsSimulation, stopPhysicsSimulation]);

  // Handle drag start
  const handleDragStart = useCallback((storyId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsDragging(storyId);
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const bubbleState = bubbleStates.get(storyId);
      if (bubbleState) {
        const bubbleX = (bubbleState.position.x / 100) * rect.width;
        const bubbleY = (bubbleState.position.y / 100) * rect.height;
        
        setDragOffset({
          x: clientX - rect.left - bubbleX,
          y: clientY - rect.top - bubbleY
        });
      }
    }
  }, [bubbleStates]);

  // Handle bubble drag
  const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    // Constrain to canvas bounds
    const constrainedX = Math.max(5, Math.min(95, x));
    const constrainedY = Math.max(5, Math.min(95, y));
    
    const bubbleState = bubbleStates.get(isDragging);
    if (bubbleState) {
      const newPosition: StoryPosition = {
        ...bubbleState.position,
        x: constrainedX,
        y: constrainedY,
        velocity: { x: 0, y: 0 } // Stop physics while dragging
      };
      
      updateBubblePosition(isDragging, newPosition);
      onPositionUpdate(isDragging, newPosition);
    }
  }, [isDragging, dragOffset, bubbleStates, updateBubblePosition, onPositionUpdate]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Add drag event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleDrag(e);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // Handle bubble click
  const handleBubbleClick = useCallback((story: Story, event: React.MouseEvent) => {
    // Only allow click if not currently dragging
    if (!isDragging) {
      event.stopPropagation();
      onStoryClick(story);
    }
  }, [isDragging, onStoryClick]);

  // Generate ambient background based on active stories
  const generateAmbientBackground = useCallback(() => {
    if (stories.length === 0) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    const colors = stories.slice(0, 3).map(story => story.visualEffects.colorTheme.primary);
    const gradientColors = colors.length > 1 
      ? colors.join(', ')
      : `${colors[0]}, ${colors[0]}80`;
    
    return `linear-gradient(135deg, ${gradientColors})`;
  }, [stories]);

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden ${className}`}>
      {/* Ambient Background */}
      <div 
        className="absolute inset-0 opacity-10 transition-all duration-1000"
        style={{
          background: generateAmbientBackground(),
          filter: 'blur(100px)'
        }}
      />
      
      {/* Particle Systems */}
      <AnimatePresence>
        {stories.map(story => (
          story.visualEffects.particles.enabled && (
            <ParticleSystem
              key={`particles-${story._id}`}
              type={story.visualEffects.particles.type}
              intensity={story.visualEffects.particles.intensity}
              color={story.visualEffects.colorTheme.accent}
              position={bubbleStates.get(story._id)?.position}
            />
          )
        ))}
      </AnimatePresence>
      
      {/* Floating Bubble Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-full"
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence>
          {stories.map(story => {
            const bubbleState = bubbleStates.get(story._id);
            if (!bubbleState) return null;
            
            return (
              <StoryBubble
                key={story._id}
                story={story}
                position={bubbleState.position}
                isActive={isDragging === story._id}
                isDragging={bubbleState.isDragging}
                onClick={(e) => handleBubbleClick(story, e)}
                onDragStart={(e) => handleDragStart(story._id, e)}
                storyCount={(story as any).storyCount || 1}
                className="absolute cursor-pointer select-none"
                style={{
                  left: `${bubbleState.position.x}%`,
                  top: `${bubbleState.position.y}%`,
                  transform: `
                    translate(-50%, -50%) 
                    scale(${bubbleState.position.scale}) 
                    translateZ(${bubbleState.position.z * 10}px)
                  `,
                  zIndex: Math.floor(bubbleState.position.z * 10) + 10,
                  opacity: 1
                }}
              />
            );
          })}
        </AnimatePresence>
        
        {/* Physics Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && false && (
          <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
            <div>Stories: {stories.length}</div>
            <div>Canvas: {canvasSize.width}x{canvasSize.height}</div>
            <div>Dragging: {isDragging || 'None'}</div>
          </div>
        )}
        
      </div>
      
      {/* Empty State */}
      {stories.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-gray-500"
          >
            <div className="text-6xl mb-4">🫧</div>
            <h3 className="text-lg font-medium mb-2">No Stories Yet</h3>
            <p className="text-sm">Create your first floating bubble story!</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// CSS Animations (to be added to global styles)
export const storyAnimationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(1deg); }
    50% { transform: translateY(-5px) rotate(-1deg); }
    75% { transform: translateY(-15px) rotate(0.5deg); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translateY(0px); }
    40%, 43% { transform: translateY(-10px); }
    70% { transform: translateY(-5px); }
  }
  
  @keyframes wave {
    0%, 100% { transform: translateX(0px) translateY(0px); }
    25% { transform: translateX(5px) translateY(-5px); }
    50% { transform: translateX(-5px) translateY(5px); }
    75% { transform: translateX(5px) translateY(-2px); }
  }
  
  @keyframes holographic {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;
