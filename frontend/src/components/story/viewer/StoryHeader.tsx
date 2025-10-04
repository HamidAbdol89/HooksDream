// StoryHeader.tsx - Story header with user info and controls
import React, { useState } from 'react';
import { X, Volume2, VolumeX, Play, Pause, Archive } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { StoryHeaderProps } from './types';
import { formatStoryTimeRemaining } from '@/utils/timeAgo';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';
import { toast } from 'sonner';

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  story,
  isPaused,
  isMuted,
  onPauseToggle,
  onMuteToggle,
  onClose,
  isOwnStory,
  onArchive,
  onPause
}) => {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Pause story when dialog opens/closes
  const handleDialogOpen = () => {
    setShowArchiveDialog(true);
    if (onPause && !isPaused) {
      onPause(true); // Pause story
    }
  };

  const handleDialogClose = () => {
    setShowArchiveDialog(false);
    if (onPause && !isPaused) {
      onPause(false); // Resume story
    }
  };

  const handleArchiveConfirm = async () => {
    if (!onArchive) return;
    
    setIsArchiving(true);
    try {
      await onArchive(story._id);
      setShowArchiveDialog(false);
      
      // Show success toast
      toast.success('Story đã được lưu trữ', {
        description: 'Bạn có thể xem lại trong khu vực lưu trữ',
        duration: 4000,
      });
    } catch (error) {
      console.error('Archive error:', error);
      
      // Show error toast
      toast.error('Không thể lưu trữ story', {
        description: 'Vui lòng thử lại sau',
        duration: 4000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20">
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
            {formatStoryTimeRemaining(story.createdAt)}
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
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPauseToggle();
          }}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
        
        {/* Archive Button - Only for own stories */}
        {isOwnStory && onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDialogOpen();
            }}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            title="Lưu trữ story"
            disabled={isArchiving}
          >
            <Archive className="w-5 h-5" />
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmDialog
        isOpen={showArchiveDialog}
        onClose={handleDialogClose}
        onConfirm={handleArchiveConfirm}
        isLoading={isArchiving}
      />
    </div>
  );
};
