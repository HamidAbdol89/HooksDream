// useStoryInteractions.ts - Reactions, replies, delete functionality
import { useState, useCallback, useEffect } from 'react';
import { Story } from '@/types/story';
import { useAppStore } from '@/store/useAppStore';
import { SessionManager } from '@/utils/sessionManager';
import { toast } from 'sonner';

interface UseStoryInteractionsProps {
  currentStory: Story;
  onReaction: (storyId: string, reactionType: string, position?: { x: number; y: number }) => void;
  onReply: (storyId: string, message: string) => void;
  onClose: () => void;
}

export const useStoryInteractions = ({
  currentStory,
  onReaction,
  onReply,
  onClose
}: UseStoryInteractionsProps) => {
  const { user } = useAppStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number>(0);

  // Check if current story is user's own story
  const isOwnStory = Boolean(user && currentStory && (currentStory.userId._id === user._id || currentStory.userId._id === user.hashId));

  // Start view tracking when story changes
  useEffect(() => {
    if (currentStory) {
      setViewStartTime(Date.now());
    }
  }, [currentStory]);

  // Handle reaction click - position above reaction picker to avoid overlap
  const handleReactionClick = useCallback((reactionType: string, event: React.MouseEvent) => {
    // Position reaction above reaction picker bar to avoid being covered
    const x = 50; // Center position
    const y = 50; // Higher position to avoid reaction picker overlap
    
    onReaction(currentStory._id, reactionType, { x, y });
    setShowReactions(false);
  }, [currentStory, onReaction]);

  // Handle reply submit
  const handleReplySubmit = useCallback(() => {
    if (replyMessage.trim()) {
      onReply(currentStory._id, replyMessage.trim());
      setReplyMessage('');
      setShowReplyInput(false);
      
      // Show success feedback
      toast.success('Reply sent!', {
        description: `Your message was sent to ${currentStory.userId.displayName}`,
        duration: 3000,
      });
    }
  }, [currentStory, replyMessage, onReply]);

  // Delete story function
  const handleDeleteStory = useCallback(async () => {
    if (!currentStory || !isOwnStory) return;
    
    try {
      console.log('Deleting story:', currentStory._id);
      
      // Get token from SessionManager
      const session = SessionManager.getAuthSession();
      const token = session?.token || localStorage.getItem('auth_token');
      
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

  // Keyboard shortcuts for interactions
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'r':
          setShowReplyInput(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    // State
    showReactions,
    showReplyInput,
    replyMessage,
    showDeleteConfirm,
    viewStartTime,
    isOwnStory,
    
    // Setters
    setShowReactions,
    setShowReplyInput,
    setReplyMessage,
    setShowDeleteConfirm,
    
    // Handlers
    handleReactionClick,
    handleReplySubmit,
    handleDeleteStory,
    handleDeleteClick
  };
};
