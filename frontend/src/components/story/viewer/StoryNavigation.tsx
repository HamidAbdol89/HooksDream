// StoryNavigation.tsx - Previous/Next navigation arrows
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryNavigationProps } from './types';

export const StoryNavigation: React.FC<StoryNavigationProps> = ({
  currentIndex,
  totalStories,
  onPrevious,
  onNext
}) => {
  return (
    <>
      {/* Previous Arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white z-10 hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* Next Arrow */}
      {currentIndex < totalStories - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white z-10 hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </>
  );
};
