// StoryViewer.tsx - Refactored main story viewer component
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryViewerProps } from './viewer/types';
import { StoryProgressBar } from './viewer/StoryProgressBar';
import { StoryHeader } from './viewer/StoryHeader';
import { StoryContent } from './viewer/StoryContent';
import { StoryNavigation } from './viewer/StoryNavigation';
import { StoryActions } from './viewer/StoryActions';
import { ReactionPicker } from './viewer/ReactionPicker';
import { ReplyInput } from './viewer/ReplyInput';
import { DeleteConfirmDialog } from './viewer/DeleteConfirmDialog';
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
  onView
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

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={handleTap}
        onPanEnd={handlePanEnd}
      >
        {/* Progress Bars */}
        <StoryProgressBar
          stories={stories}
          currentIndex={currentIndex}
          progress={progress}
        />

        {/* Header */}
        <StoryHeader
          story={currentStory}
          isPaused={isPaused}
          isMuted={isMuted}
          onPauseToggle={handlePauseToggle}
          onMuteToggle={handleMuteToggle}
          onClose={onClose}
          isOwnStory={isOwnStory}
        />

        {/* Story Content */}
        <StoryContent
          story={currentStory}
          mediaAspectRatio={mediaAspectRatio}
          isMuted={isMuted}
          onVideoLoadedMetadata={() => handleVideoLoadedMetadata(videoRef.current!)}
          onVideoTimeUpdate={() => {
            if (videoRef.current) {
              handleVideoTimeUpdate(videoRef.current.currentTime, videoRef.current.duration);
            }
          }}
          onImageLoad={() => handleImageLoad(imageRef.current!)}
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
          isOwnStory={isOwnStory}
          onReactionToggle={() => setShowReactions(!showReactions)}
          onReplyToggle={() => setShowReplyInput(true)}
          onDeleteClick={handleDeleteClick}
        />

        {/* Reaction Picker */}
        <ReactionPicker
          show={showReactions}
          onReactionClick={handleReactionClick}
        />

        {/* Reply Input */}
        <ReplyInput
          show={showReplyInput}
          message={replyMessage}
          onMessageChange={setReplyMessage}
          onSubmit={handleReplySubmit}
          onClose={() => setShowReplyInput(false)}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          show={showDeleteConfirm}
          onConfirm={handleDeleteStory}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
};
