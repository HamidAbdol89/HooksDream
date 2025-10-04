// useStoryMedia.ts - Media handling (video/image aspect ratio, controls)
import { useState, useCallback, useEffect } from 'react';
import { Story } from '@/types/story';
import { MediaAspectRatio } from '../types';

interface UseStoryMediaProps {
  currentStory: Story;
  isMuted: boolean;
}

export const useStoryMedia = ({ currentStory, isMuted }: UseStoryMediaProps) => {
  const [videoDuration, setVideoDuration] = useState<number>(5000);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<MediaAspectRatio>('portrait');

  // Detect media aspect ratio
  const detectAspectRatio = useCallback((width: number, height: number) => {
    const ratio = width / height;
    if (ratio > 1.2) {
      setMediaAspectRatio('landscape');
    } else if (ratio < 0.8) {
      setMediaAspectRatio('portrait');
    } else {
      setMediaAspectRatio('square');
    }
  }, []);

  // Handle video metadata loaded
  const handleVideoLoadedMetadata = useCallback((videoElement: HTMLVideoElement) => {
    const duration = videoElement.duration;
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    
    setVideoDuration(duration);
    detectAspectRatio(width, height);
    
    // Auto play and set mute state
    videoElement.muted = isMuted;
    videoElement.play().catch(console.error);
  }, [isMuted, detectAspectRatio]);

  // Handle image load
  const handleImageLoad = useCallback((imageElement: HTMLImageElement) => {
    const width = imageElement.naturalWidth;
    const height = imageElement.naturalHeight;
    detectAspectRatio(width, height);
  }, [detectAspectRatio]);

  // Get media container classes based on aspect ratio
  const getMediaContainerClasses = useCallback(() => {
    const baseClasses = "flex items-center justify-center w-full h-full";
    
    switch (mediaAspectRatio) {
      case 'landscape':
        return `${baseClasses} px-0 py-8`; // Add vertical padding for landscape
      case 'portrait':
        return `${baseClasses}`; // Full screen for portrait - no padding
      case 'square':
        return `${baseClasses} p-4`; // Balanced padding for square
      default:
        return baseClasses;
    }
  }, [mediaAspectRatio]);

  // Get media element classes
  const getMediaClasses = useCallback(() => {
    switch (mediaAspectRatio) {
      case 'landscape':
        return "w-full h-auto max-h-full object-contain"; // Fit width, maintain aspect ratio
      case 'portrait':
        return "w-full h-full object-cover"; // Full screen cover for portrait
      case 'square':
        return "max-w-full max-h-full object-contain"; // Fit both dimensions
      default:
        return "w-full h-full object-cover"; // Default fallback
    }
  }, [mediaAspectRatio]);

  // Reset media state when story changes
  useEffect(() => {
    if (currentStory) {
      // Set aspect ratio based on content type
      if (currentStory.media.type === 'text') {
        setMediaAspectRatio('portrait'); // Text stories are always portrait for full screen
      } else {
        setMediaAspectRatio('portrait'); // Reset to default, will be updated by media load
      }
      
      // Reset video duration for new story
      if (currentStory.media.type !== 'video') {
        setVideoDuration(5); // Default for non-video content
      }
    }
  }, [currentStory]);

  return {
    videoDuration,
    mediaAspectRatio,
    handleVideoLoadedMetadata,
    handleImageLoad,
    getMediaContainerClasses,
    getMediaClasses
  };
};
