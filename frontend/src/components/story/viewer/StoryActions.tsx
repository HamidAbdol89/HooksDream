// StoryActions.tsx - Bottom action buttons (heart, message, delete)
import React from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { StoryActionsProps } from './types';

export const StoryActions: React.FC<StoryActionsProps> = ({
  currentIndex,
  totalStories,
  isOwnStory,
  onReactionToggle,
  onReplyToggle,
  onDeleteClick
}) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReactionToggle();
            }}
            className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <Heart className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplyToggle();
            }}
            className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          
          {/* Delete button - Only for own stories */}
          {isOwnStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              className="p-3 bg-black/50 rounded-full text-white hover:bg-red-600/70 transition-colors"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {totalStories}
        </div>
      </div>
    </div>
  );
};
