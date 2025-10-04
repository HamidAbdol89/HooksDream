// StoryViewer.tsx - Full-screen Story Viewer with innovative UI
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share, Send, Play, Pause, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Story, REACTION_TYPES } from '@/types/story';
import { SessionManager } from '@/utils/sessionManager';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReaction: (storyId: string, reactionType: string, position?: { x: number; y: number }) => void;
  onReply: (storyId: string, message: string) => void;
  onView: (storyId: string, duration: number) => void;
}

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
  const { user } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false); // Auto unmute for videos
  const [viewStartTime, setViewStartTime] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(5000); // Default 5s, will be updated for videos
  const [mediaAspectRatio, setMediaAspectRatio] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  
  const progressRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const currentStory = stories[currentIndex];
  
  // Dynamic story duration based on content type
  const getStoryDuration = useCallback(() => {
    if (currentStory?.media.type === 'video' && videoDuration > 0) {
      return videoDuration * 1000; // Convert to milliseconds
    }
    return 5000; // Default 5 seconds for images/text
  }, [currentStory, videoDuration]);
  
  // Check if current story is user's own story
  const isOwnStory = user && currentStory && (currentStory.userId._id === user._id || currentStory.userId._id === user.hashId);

  // Delete story function
  const handleDeleteStory = useCallback(async () => {
    if (!currentStory || !isOwnStory) return;
    
    try {
      console.log('Deleting story:', currentStory._id);
      
      // Get token from SessionManager
      const session = SessionManager.getAuthSession();
      const token = session?.token || localStorage.getItem('auth_token');
      
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      // Check user ID match
      console.log('Current user ID:', user?._id || user?.hashId);
      console.log('Story owner ID:', currentStory.userId._id);
      console.log('Is own story:', isOwnStory);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.MODE === 'development' 
          ? 'http://localhost:5000' 
          : 'https://just-solace-production.up.railway.app');
      
      const response = await fetch(`${API_BASE_URL}/api/stories/${currentStory._id}`, {
        method: 'DELETE',
        headers
      });

      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Delete success:', result);
        setShowDeleteConfirm(false);
        
        // Show success toast
        toast.success('Story deleted successfully', {
          description: 'Your story has been removed from the timeline',
          duration: 3000,
        });
        
        // Close viewer and story will be removed by React Query cache invalidation
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', response.status, errorData);
        
        // Show error toast
        toast.error('Failed to delete story', {
          description: errorData.message || 'Please try again later',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      
      // Show network error toast
      toast.error('Network error', {
        description: 'Please check your connection and try again',
        duration: 4000,
      });
    }
  }, [currentStory, isOwnStory, onClose]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

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
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      setVideoDuration(duration);
      detectAspectRatio(width, height);
      
      // Auto play and unmute video
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(console.error);
    }
  }, [isMuted, detectAspectRatio]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const width = imageRef.current.naturalWidth;
      const height = imageRef.current.naturalHeight;
      detectAspectRatio(width, height);
    }
  }, [detectAspectRatio]);

  // Handle video time update for progress
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current && currentStory?.media.type === 'video') {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        const newProgress = (currentTime / duration) * 100;
        setProgress(newProgress);
        
        // Auto advance when video ends
        if (currentTime >= duration - 0.1) { // Small buffer to prevent timing issues
          if (currentIndex < stories.length - 1) {
            onNext();
          } else {
            onClose();
          }
        }
      }
    }
  }, [currentStory, currentIndex, stories.length, onNext, onClose]);

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

  // Start view tracking
  useEffect(() => {
    if (currentStory) {
      setViewStartTime(Date.now());
      setProgress(0);
      
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

  // Progress bar animation (only for non-video content)
  useEffect(() => {
    if (!currentStory || isPaused || currentStory.media.type === 'video') return;

    const duration = getStoryDuration();
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        // Handle next will be defined later
        if (currentIndex < stories.length - 1) {
          onNext();
        } else {
          onClose();
        }
      } else {
        progressRef.current = setTimeout(updateProgress, 50);
      }
    };

    progressRef.current = setTimeout(updateProgress, 50);

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [currentStory, isPaused, getStoryDuration, currentIndex, stories.length, onNext, onClose]);

  // Handle story navigation
  const handleNext = useCallback(() => {
    if (viewStartTime > 0) {
      const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
      onView(currentStory._id, viewDuration);
    }
    
    if (currentIndex < stories.length - 1) {
      onNext();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onNext, onClose, onView, currentStory, viewStartTime]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onPrevious();
    }
  }, [currentIndex, onPrevious]);

  // Handle tap zones
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
      setIsPaused(!isPaused);
      
      // Control video playback
      if (currentStory?.media.type === 'video' && videoRef.current) {
        if (isPaused) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
      }
    }
  }, [handlePrevious, handleNext, isPaused, currentStory]);

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

  // Handle reaction click - position above reaction picker to avoid overlap
  const handleReactionClick = useCallback((reactionType: string, event: React.MouseEvent) => {
    // Position reaction above reaction picker bar to avoid being covered
    const x = 50; // Heart button position from left (15% from left edge)
    const y = 50; // Higher position to avoid reaction picker overlap (65% from top)
    
    onReaction(currentStory._id, reactionType, { x, y });
    setShowReactions(false);
  }, [currentStory, onReaction]);

  // Handle reply submit
  const handleReplySubmit = useCallback(() => {
    if (replyMessage.trim()) {
      onReply(currentStory._id, replyMessage.trim());
      setReplyMessage('');
      setShowReplyInput(false);
    }
  }, [currentStory, replyMessage, onReply]);

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
        case 'r':
          setShowReplyInput(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevious, handleNext, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
      
      // Record final view duration
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
        <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
          {stories.map((_: Story, index: number) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%'
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentStory.userId.avatar} alt={currentStory.userId.displayName} />
              <AvatarFallback>{currentStory.userId.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">
                  {currentStory.userId.displayName}
                </span>
                {currentStory.userId.isVerified && (
                  <span className="text-blue-400">✓</span>
                )}
              </div>
              <span className="text-white/70 text-sm">
                {new Date(currentStory.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStory.media.type === 'video' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                  }
                }}
                className="p-2 bg-black/50 rounded-full text-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
                
                // Control video playback
                if (currentStory?.media.type === 'video' && videoRef.current) {
                  if (isPaused) {
                    videoRef.current.play().catch(console.error);
                  } else {
                    videoRef.current.pause();
                  }
                }
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

        {/* Story Content */}
        <motion.div
          key={currentStory._id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full"
        >
          {/* Background Media Container */}
          <div className={getMediaContainerClasses()}>
            {currentStory.media.type === 'image' && currentStory.media.url && (
              <img
                ref={imageRef}
                src={currentStory.media.url}
                alt="Story content"
                className={getMediaClasses()}
                onLoad={handleImageLoad}
              />
            )}
          
            
            {currentStory.media.type === 'video' && currentStory.media.url && (
              <video
                ref={videoRef}
                src={currentStory.media.url}
                className={getMediaClasses()}
                autoPlay
                muted={isMuted}
                playsInline
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedData={() => setIsPaused(false)}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
              />
            )}
            
            {currentStory.media.type === 'text' && (
              <div 
                className="w-full h-full flex items-center justify-center text-white font-bold text-center p-8"
                style={{ 
                  background: `linear-gradient(135deg, ${currentStory.visualEffects.colorTheme.primary}, ${currentStory.visualEffects.colorTheme.secondary})`,
                  fontSize: 'clamp(1.5rem, 4vw, 3rem)'
                }}
              >
                {currentStory.content}
              </div>
            )}
          </div>
          
          {/* Content Overlay */}
          {currentStory.content && currentStory.media.type !== 'text' && (
            <div className="absolute bottom-20 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white text-lg">{currentStory.content}</p>
              </div>
            </div>
          )}
          
          {/* Reactions Display */}
          <AnimatePresence>
            {currentStory.reactions.slice(-5).map((reaction: any, index: number) => (
              <motion.div
                key={`${reaction._id}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute pointer-events-none text-2xl"
                style={{
                  left: `${reaction.position.x}%`,
                  top: `${reaction.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {REACTION_TYPES.find(r => r.type === reaction.type)?.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {currentIndex < stories.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactions(!showReactions);
                }}
                className="p-3 bg-black/50 rounded-full text-white"
              >
                <Heart className="w-6 h-6" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReplyInput(true);
                }}
                className="p-3 bg-black/50 rounded-full text-white"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              
              {/* Delete button - Only for own stories */}
              {isOwnStory && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {stories.length}
            </div>
          </div>
        </div>
{/* Reaction Picker */}
<AnimatePresence>
  {showReactions && (
    <motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
className={cn(
  "absolute inset-x-0 bottom-16 sm:bottom-20 md:bottom-30 z-30",
  "flex justify-center",
  "bg-black/80 backdrop-blur-sm rounded-full",
  "w-full max-w-[99%] sm:max-w-md mx-auto","overflow-x-auto no-scrollbar"

)}

>
  <div className="flex space-x-2 max-w-[90%] sm:max-w-md">
    {REACTION_TYPES.map((reaction: any) => (
      <button
        key={reaction.type}
        onClick={(e) => {
          e.stopPropagation();
          handleReactionClick(reaction.type, e);
        }}
        className="p-3 hover:bg-white/20 rounded-full transition-colors text-2xl"
      >
        {reaction.emoji}
      </button>
    ))}
  </div>
</motion.div>

  )}
</AnimatePresence>

        {/* Reply Input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-4 z-30"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Reply to story..."
                  className="flex-1 bg-white/20 text-white placeholder-white/70 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleReplySubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleReplySubmit}
                  disabled={!replyMessage.trim()}
                  size="sm"
                  className="px-6"
                >
                  Send
                </Button>
                <button
                  onClick={() => setShowReplyInput(false)}
                  className="p-3 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Story?
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    This story will be permanently deleted and cannot be recovered.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleDeleteStory}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      
      </motion.div>
    </AnimatePresence>
  );
};
