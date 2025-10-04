// useStoryNavigation.ts - Navigation handlers and gestures
import { useCallback, useEffect } from 'react';
import { PanInfo } from 'framer-motion';
import { Story } from '@/types/story';

interface UseStoryNavigationProps {
  currentIndex: number;
  totalStories: number;
  currentStory: Story;
  viewStartTime: number;
  isPaused: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onView: (storyId: string, duration: number) => void;
  onPauseToggle: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useStoryNavigation = ({
  currentIndex,
  totalStories,
  currentStory,
  viewStartTime,
  isPaused,
  onNext,
  onPrevious,
  onClose,
  onView,
  onPauseToggle,
  videoRef
}: UseStoryNavigationProps) => {

  // Handle story navigation with view tracking
  const handleNext = useCallback(() => {
    if (viewStartTime > 0) {
      const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
      onView(currentStory._id, viewDuration);
    }
    
    if (currentIndex < totalStories - 1) {
      onNext();
    } else {
      onClose();
    }
  }, [currentIndex, totalStories, onNext, onClose, onView, currentStory, viewStartTime]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onPrevious();
    }
  }, [currentIndex, onPrevious]);

  // Handle tap zones (left: previous, right: next, center: pause/play)
  const handleTap = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const tapZone = rect.width / 3;
    
    if (x < tapZone) {
      handlePrevious();
    } else if (x > tapZone * 2) {
      handleNext();
    } else {
      // Toggle pause/play
      onPauseToggle();
      
      // Control video playback
      if (currentStory?.media.type === 'video' && videoRef.current) {
        if (isPaused) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
      }
    }
  }, [handlePrevious, handleNext, onPauseToggle, isPaused, currentStory, videoRef]);

  // Handle swipe gestures
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
      if (offset.y > 0) {
        onClose();
      }
    }
  }, [handlePrevious, handleNext, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevious, handleNext, onClose]);

  return {
    handleNext,
    handlePrevious,
    handleTap,
    handlePanEnd
  };
};
