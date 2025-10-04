// StoryViewer.tsx - Professional story viewer with gesture handling
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSpring, animated, useTransition } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { StoryViewerProps } from './viewer/types';
import { SpringProgressBar as StoryProgressBar } from './viewer/SpringProgressBar';
import { StoryContent } from './viewer/StoryContent';
import { StoryHeader } from './viewer/StoryHeader';
import { StoryNavigation } from './viewer/StoryNavigation';
import { StoryActions } from './viewer/StoryActions';
import { ReactionPicker } from './viewer/ReactionPicker';
import { ReplyModal } from './viewer/ReplyModal';
import { DeleteConfirmDialog } from './viewer/DeleteConfirmDialog';
import { RepliesDialog } from './viewer/RepliesDialog';
import { ReactionsDialog } from './viewer/ReactionsDialog';
import { useStoryProgress } from './viewer/hooks/useStoryProgress';
import { useStoryNavigation } from './viewer/hooks/useStoryNavigation';
import { useStoryMedia } from './viewer/hooks/useStoryMedia';
import { useStoryInteractions } from './viewer/hooks/useStoryInteractions';

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onReaction,
  onReply,
  onView,
  onArchive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Local state for pause/mute controls
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const currentStory = stories[currentIndex];

  // Pause/Mute toggle handlers
  const handlePauseToggle = useCallback(() => {
    setIsPaused(!isPaused);
    
    // Control video playback
    if (currentStory?.media.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPaused, currentStory]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Reset pause state when story changes
  useEffect(() => {
    setIsPaused(false);
  }, [currentStory]);
  
  // Custom hooks for different concerns
  const {
    showReactions,
    showReplyInput,
    replyMessage,
    showDeleteConfirm,
    viewStartTime,
    isOwnStory,
    setShowReactions,
    setShowReplyInput,
    setReplyMessage,
    setShowDeleteConfirm,
    handleReactionClick,
    handleReplySubmit,
    handleDeleteStory,
    handleDeleteClick
  } = useStoryInteractions({
    currentStory,
    onReaction,
    onReply,
    onClose
  });

  // Toggle handlers for actions
  const handleReactionToggle = () => {
    setShowReactions(!showReactions);
    if (!showReactions) {
      handlePauseToggle(); // Auto pause when opening reactions
    }
  };
  
  const handleReplyToggle = () => {
    setShowReplyInput(!showReplyInput);
    if (!showReplyInput) {
      handlePauseToggle(); // Auto pause when opening reply input
    }
  };
  
  // Replies dialog state
  const [showRepliesDialog, setShowRepliesDialog] = useState(false);
  const handleRepliesToggle = () => {
    setShowRepliesDialog(!showRepliesDialog);
    if (!showRepliesDialog) {
      handlePauseToggle(); // Auto pause when opening dialog
    }
  };

  // Reactions dialog state
  const [showReactionsDialog, setShowReactionsDialog] = useState(false);
  const handleReactionsToggle = () => {
    setShowReactionsDialog(!showReactionsDialog);
    if (!showReactionsDialog) {
      handlePauseToggle(); // Auto pause when opening dialog
    }
  };

  const {
    videoDuration,
    mediaAspectRatio,
    handleVideoLoadedMetadata,
    handleImageLoad
  } = useStoryMedia({
    currentStory,
    isMuted
  });

  const {
    progress,
    handleVideoTimeUpdate
  } = useStoryProgress({
    currentStory,
    isPaused,
    videoDuration,
    currentIndex,
    totalStories: stories.length,
    onNext,
    onClose
  });

  const {
    handleNext,
    handlePrevious,
    handleTap,
    handlePanEnd
  } = useStoryNavigation({
    currentIndex,
    totalStories: stories.length,
    currentStory,
    viewStartTime,
    isPaused,
    onNext,
    onPrevious,
    onClose,
    onView,
    onPauseToggle: handlePauseToggle,
    videoRef
  });

  // Cleanup on unmount - record final view duration
  useEffect(() => {
    return () => {
      if (viewStartTime > 0) {
        const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
        onView(currentStory._id, viewDuration);
      }
    };
  }, []);

  // Professional keyboard shortcuts - disabled when in input mode
  const isInputMode = showReplyInput || showReactions || showRepliesDialog || showReactionsDialog || showDeleteConfirm;

  useHotkeys('left, ArrowLeft', () => {
    if (currentIndex > 0) onPrevious();
  }, { 
    preventDefault: true,
    enabled: !isInputMode 
  });

  useHotkeys('right, ArrowRight', () => {
    if (currentIndex < stories.length - 1) onNext();
    else onClose();
  }, { 
    preventDefault: true,
    enabled: !isInputMode 
  });

  useHotkeys('space', (e) => {
    e.preventDefault();
    handlePauseToggle();
  }, { 
    preventDefault: true,
    enabled: !isInputMode 
  });

  useHotkeys('escape', () => {
    if (showReplyInput) {
      setShowReplyInput(false);
    } else if (showReactions) {
      setShowReactions(false);
    } else if (showRepliesDialog) {
      setShowRepliesDialog(false);
    } else if (showReactionsDialog) {
      setShowReactionsDialog(false);
    } else if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  }, { preventDefault: true });

  useHotkeys('m', () => {
    if (currentStory?.media.type === 'video') {
      handleMuteToggle();
    }
  }, { preventDefault: true });

  // Professional gesture handling
  const bind = useGesture({
    onDrag: ({ direction, distance, cancel, event }) => {
      // Prevent drag on interactive elements
      const target = event.target as HTMLElement;
      if (target.closest('button, input, textarea')) {
        cancel();
        return;
      }

      const [xDir] = direction;
      if (distance[0] > 100 || distance[1] > 100) {
        cancel();
        if (xDir > 0) {
          // Swipe right - previous story
          if (currentIndex > 0) onPrevious();
        } else {
          // Swipe left - next story
          if (currentIndex < stories.length - 1) onNext();
          else onClose();
        }
      }
    },
    onClick: ({ event }) => {
      const target = event.target as HTMLElement;
      // Don't handle tap on interactive elements
      if (target.closest('button, input, textarea')) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftSide = x < rect.width / 2;
      
      if (isLeftSide && currentIndex > 0) {
        onPrevious();
      } else if (!isLeftSide) {
        if (currentIndex < stories.length - 1) onNext();
        else onClose();
      }
    }
  });

  // Smooth viewer entrance animation
  const viewerSpring = useSpring({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8
    }
  });

  if (!currentStory) return null;

  return (
    <animated.div
      {...bind()}
      style={viewerSpring}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center touch-none select-none"
    >
        {/* Progress Bars */}
        <StoryProgressBar
          stories={stories}
          currentIndex={currentIndex}
          progress={progress}
        />

        {/* Story Header */}
        <StoryHeader
          story={currentStory}
          isPaused={isPaused}
          isMuted={isMuted}
          onPauseToggle={handlePauseToggle}
          onMuteToggle={handleMuteToggle}
          onClose={onClose}
          isOwnStory={currentStory?.isOwn || false}
          onArchive={onArchive}
          onPause={(paused) => setIsPaused(paused)}
        />

        {/* Story Content */}
        <StoryContent
          story={currentStory}
          mediaAspectRatio={mediaAspectRatio}
          isMuted={isMuted}
          isPaused={isPaused}
          onVideoLoadedMetadata={handleVideoLoadedMetadata}
          onVideoTimeUpdate={handleVideoTimeUpdate}
          onImageLoad={handleImageLoad}
          onPauseToggle={handlePauseToggle}
          onRepliesToggle={handleRepliesToggle}
          videoRef={videoRef}
          imageRef={imageRef}
        />


        {/* Navigation Arrows */}
        <StoryNavigation
          currentIndex={currentIndex}
          totalStories={stories.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
        {/* Bottom Actions */}
        <StoryActions
          currentIndex={currentIndex}
          totalStories={stories.length}
          isOwnStory={currentStory?.isOwn || false}
          story={currentStory}
          onReactionToggle={handleReactionToggle}
          onReplyToggle={handleReplyToggle}
          onDeleteClick={handleDeleteClick}
          onPauseToggle={handlePauseToggle}
          onReactionsClick={handleReactionsToggle}
        />
        {/* Reaction Picker */}
        <ReactionPicker
          show={showReactions}
          onReactionClick={handleReactionClick}
        />

        {/* Reply Modal */}
        <ReplyModal
          show={showReplyInput}
          message={replyMessage}
          onMessageChange={setReplyMessage}
          onSubmit={handleReplySubmit}
          onClose={() => setShowReplyInput(false)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmDialog
          show={showDeleteConfirm}
          onConfirm={handleDeleteStory}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Replies Dialog */}
        <RepliesDialog
          show={showRepliesDialog}
          replies={currentStory?.replies || []}
          onClose={() => setShowRepliesDialog(false)}
        />

        {/* Reactions Dialog */}
        <ReactionsDialog
          show={showReactionsDialog}
          reactions={currentStory?.reactions || []}
          onClose={() => setShowReactionsDialog(false)}
        />
      </animated.div>
  );
};
