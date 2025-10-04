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
    // Only process if this is for the current story
    if (!currentStory || currentStory.media.type !== 'video') return;
    
    const duration = videoElement.duration;
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    
    setVideoDuration(duration);
    detectAspectRatio(width, height);
    
    // Auto play and set mute state
    videoElement.muted = isMuted;
    videoElement.play().catch(console.error);
  }, [isMuted, detectAspectRatio, currentStory]);

  // Handle image load
  const handleImageLoad = useCallback((imageElement: HTMLImageElement) => {
    // Only process if this is for the current story
    if (!currentStory || currentStory.media.type !== 'image') return;
    
    const width = imageElement.naturalWidth;
    const height = imageElement.naturalHeight;
    
    detectAspectRatio(width, height);
  }, [detectAspectRatio, currentStory]);

  // Reset aspect ratio and duration when story changes
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
    handleImageLoad
  };
};
