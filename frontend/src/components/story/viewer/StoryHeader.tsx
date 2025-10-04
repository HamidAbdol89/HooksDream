// StoryHeader.tsx - Story header with user info and controls
import React from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { StoryHeaderProps } from './types';

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  isPaused,
  isMuted,
  onPauseToggle,
  onMuteToggle,
  onClose,
  isOwnStory
}) => {
  return (
    <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10 border-2 border-white">
          <AvatarImage src={story.userId.avatar} alt={story.userId.displayName} />
          <AvatarFallback>{story.userId.displayName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">
              {story.userId.displayName}
            </span>
            {story.userId.isVerified && (
              <span className="text-blue-400">✓</span>
            )}
          </div>
          <span className="text-white/70 text-sm">
            {new Date(story.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {story.media.type === 'video' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle();
            }}
            className="p-2 bg-black/50 rounded-full text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPauseToggle();
          }}
          className="p-2 bg-black/50 rounded-full text-white"
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 bg-black/50 rounded-full text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
