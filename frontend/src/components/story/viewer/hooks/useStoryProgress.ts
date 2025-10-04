// useStoryProgress.ts - Ultra-smooth progress tracking for React Spring
import { useState, useEffect, useRef, useCallback } from 'react';
import { Story } from '@/types/story';

interface UseStoryProgressProps {
  currentStory: Story;
  isPaused: boolean;
  videoDuration: number;
  currentIndex: number;
  totalStories: number;
  onNext: () => void;
  onClose: () => void;
}

export const useStoryProgress = ({
  currentStory,
  isPaused,
  videoDuration,
  currentIndex,
  totalStories,
  onNext,
  onClose
}: UseStoryProgressProps) => {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef<number>();

  // Dynamic story duration based on content type
  const getStoryDuration = useCallback(() => {
    if (currentStory?.media.type === 'video' && videoDuration > 0) {
      return videoDuration * 1000; // Convert to milliseconds
    }
    return 5000; // Default 5 seconds for images/text
  }, [currentStory, videoDuration]);

  // Reset progress when story changes
  useEffect(() => {
    if (currentStory) {
      setProgress(0);
    }
  }, [currentStory]);

  // Ultra-smooth progress bar animation (only for non-video content)
  useEffect(() => {
    if (!currentStory || isPaused || currentStory.media.type === 'video') return;

    const duration = getStoryDuration();
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        if (currentIndex < totalStories - 1) {
          onNext();
        } else {
          onClose();
        }
      } else {
        // Use requestAnimationFrame for 60fps smooth updates
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Start with requestAnimationFrame for smoother updates
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentStory, isPaused, getStoryDuration, currentIndex, totalStories, onNext, onClose]);

  // Smooth video progress tracking with requestAnimationFrame
  const handleVideoTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (currentStory?.media.type === 'video' && duration > 0) {
      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const newProgress = Math.min((currentTime / duration) * 100, 100);
        setProgress(newProgress);
        
        // Auto advance when video ends
        if (currentTime >= duration - 0.1) {
          if (currentIndex < totalStories - 1) {
            onNext();
          } else {
            onClose();
          }
        }
      });
    }
  }, [currentStory, currentIndex, totalStories, onNext, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    progress,
    setProgress,
    handleVideoTimeUpdate,
    getStoryDuration
  };
};
