// SpringProgressBar.tsx - React Spring for buttery smooth continuous progress
import React from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Story } from '@/types/story';
import { StoryProgressBarProps } from './types';

export const SpringProgressBar: React.FC<StoryProgressBarProps> = ({
  stories,
  currentIndex,
  progress
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
      {stories.map((_: Story, index: number) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;
        const targetWidth = isCompleted ? 100 : (isActive ? progress : 0);
        
        // Different spring configs for different states
        let springConfig;
        if (isCompleted) {
          // Instant for completed stories
          springConfig = { ...config.default, tension: 500, friction: 50 };
        } else if (isActive) {
          // Ultra smooth for active story
          springConfig = { 
            tension: 200,    // Moderate speed
            friction: 25,    // Very smooth
            precision: 0.001, // Ultra precise
            mass: 1          // Light mass for responsiveness
          };
        } else {
          // Quick for pending stories
          springConfig = { ...config.default, tension: 400, friction: 40 };
        }
        
        // React Spring for ultra-smooth continuous animation
        const springProps = useSpring({
          width: `${targetWidth}%`,
          config: springConfig,
          immediate: isPending // Immediate for pending stories
        });
        
        return (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <animated.div
              className="h-full bg-white rounded-full"
              style={{
                ...springProps,
                transform: 'translateZ(0)', // Hardware acceleration
                willChange: isActive ? 'width' : 'auto',
                backfaceVisibility: 'hidden',
                // Additional smoothness optimizations
                WebkitTransform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                perspective: '1000px'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
