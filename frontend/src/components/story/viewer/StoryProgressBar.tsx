// StoryProgressBar.tsx - Progress indicators for stories
import React from 'react';
import { motion } from 'framer-motion';
import { Story } from '@/types/story';
import { StoryProgressBarProps } from './types';

export const StoryProgressBar: React.FC<StoryProgressBarProps> = ({
  stories,
  currentIndex,
  progress
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
      {stories.map((_: Story, index: number) => (
        <div
          key={index}
          className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: '0%' }}
            animate={{
              width: index < currentIndex ? '100%' : 
                     index === currentIndex ? `${progress}%` : '0%'
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      ))}
    </div>
  );
};
