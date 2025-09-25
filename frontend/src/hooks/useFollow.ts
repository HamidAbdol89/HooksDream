// hooks/useFollow.ts - Hook quản lý follow state với Socket.IO
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useFollowSocket } from './useSocket';
import { useToast } from '@/components/ui/use-toast';

interface UseFollowProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
}

export const useFollow = ({ 
  userId, 
  initialIsFollowing = false, 
  initialFollowerCount = 0 
}: UseFollowProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Socket.IO for real-time updates
  const { onFollowUpdate, emitFollow } = useFollowSocket();

  // Check follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await api.follow.checkFollowStatus(userId);
        if (response.success) {
          setIsFollowing(response.data.isFollowing);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    if (userId) {
      checkFollowStatus();
    }
  }, [userId]);

  // Listen for real-time follow updates
  useEffect(() => {
    onFollowUpdate((data) => {
      // Update if this is about the current user
      if (data.targetUserId === userId || data.followingId === userId) {
        console.log('🔄 Follow update received:', data);
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    });
  }, [userId, onFollowUpdate]);

  // Handle follow/unfollow action
  const handleToggleFollow = useCallback(async () => {
    if (isLoading) return;

    // Optimistic update
    const newIsFollowing = !isFollowing;
    const newFollowerCount = newIsFollowing ? followerCount + 1 : Math.max(0, followerCount - 1);
    
    setIsFollowing(newIsFollowing);
    setFollowerCount(newFollowerCount);
    setIsLoading(true);

    // Emit to Socket.IO for real-time updates
    emitFollow(userId, newIsFollowing, newFollowerCount);

    try {
      const response = await api.follow.toggleFollow(userId);
      
      if (response.success) {
        // Update with server response
        setIsFollowing(response.data.isFollowing);
        setFollowerCount(response.data.followerCount);
        
        toast({
          title: response.data.isFollowing ? 'Followed!' : 'Unfollowed!',
          description: response.message,
        });
      } else {
        throw new Error(response.message || 'Follow action failed');
      }
    } catch (error) {
      console.error('Follow error:', error);
      
      // Revert optimistic update on error
      setIsFollowing(!newIsFollowing);
      setFollowerCount(followerCount);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, followerCount, isLoading, emitFollow, toast]);

  return {
    isFollowing,
    followerCount,
    isLoading,
    handleToggleFollow,
    setIsFollowing, // For manual updates
    setFollowerCount, // For manual updates
  };
};
