// StoryActions.tsx - Bottom action buttons (heart, message, delete)
import React from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { StoryActionsProps } from './types';
import { ReactionBar } from './ReactionBar';

export const StoryActions: React.FC<StoryActionsProps> = ({
  currentIndex,
  totalStories,
  isOwnStory,
  story,
  onReactionToggle,
  onReplyToggle,
  onDeleteClick,
  onPauseToggle,
  onReactionsClick
}) => {
  return (
    <div 
      className="absolute bottom-4 left-4 right-4 z-20"
      onClick={(e) => {
        // Check if clicking on empty area (not on buttons)
        const target = e.target as HTMLElement;
        if (target === e.currentTarget) {
          onPauseToggle();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Reaction Bar or Action buttons */}
        <div className="flex items-center space-x-4">
          {/* Reaction Bar - Only for story author */}
          <ReactionBar 
            reactions={story.reactions || []}
            isVisible={isOwnStory}
            onClick={onReactionsClick}
          />
          
          {/* Action buttons - Only for other people's stories */}
          {!isOwnStory && (
            <>
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
            </>
          )}
        </div>
        
        {/* Right side - Delete button for own stories */}
        {isOwnStory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            className="p-3 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-full text-red-400 hover:bg-red-500/30 hover:border-red-400/50 hover:text-red-300 transition-all duration-300 shadow-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
