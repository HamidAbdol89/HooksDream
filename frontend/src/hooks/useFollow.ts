// hooks/useFollow.ts - Hook quản lý follow state với Socket.IO
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useFollowSocket } from '@/hooks/useSocket';

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
  
  // Socket.IO for real-time updates
  const { onFollowUpdate, emitFollow } = useFollowSocket();

  // Check follow status on mount - ONLY if no initial value provided
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await api.follow.checkFollowStatus(userId);
        if (response.success) {
          setIsFollowing(response.data.isFollowing);
        }
      } catch (error) {
        // Silent fail
      }
    };

    // ✅ Only check if we don't have initial value
    if (userId && initialIsFollowing === false && initialFollowerCount === 0) {
      checkFollowStatus();
    }
  }, [userId, initialIsFollowing, initialFollowerCount]);

  // Listen for real-time follow updates
  useEffect(() => {
    onFollowUpdate((data) => {
      // Update if this is about the current user
      if (data.targetUserId === userId || data.followingId === userId) {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    });
  }, [userId, onFollowUpdate]);

  // Handle follow/unfollow action
  const handleToggleFollow = useCallback(async () => {
    if (isLoading) return;

    // ✅ Store original values for rollback
    const originalIsFollowing = isFollowing;
    const originalFollowerCount = followerCount;

    // Optimistic update
    const newIsFollowing = !isFollowing;
    const newFollowerCount = newIsFollowing ? followerCount + 1 : Math.max(0, followerCount - 1);
    
    setIsFollowing(newIsFollowing);
    setFollowerCount(newFollowerCount);
    setIsLoading(true);

    try {
      const response = await api.follow.toggleFollow(userId);
      
      if (response.success) {
        // ✅ Update with server response (more accurate)
        setIsFollowing(response.data.isFollowing);
        setFollowerCount(response.data.followerCount);
        
        // ✅ Emit Socket AFTER successful API call
        emitFollow(userId, response.data.isFollowing, response.data.followerCount);
        
      } else {
        throw new Error(response.message || 'Follow action failed');
      }
    } catch (error) {
      // ✅ Revert to original values on error
      setIsFollowing(originalIsFollowing);
      setFollowerCount(originalFollowerCount);
      
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, followerCount, isLoading, emitFollow]);

  return {
    isFollowing,
    followerCount,
    isLoading,
    handleToggleFollow,
    setIsFollowing, // For manual updates
    setFollowerCount, // For manual updates
  };
};
