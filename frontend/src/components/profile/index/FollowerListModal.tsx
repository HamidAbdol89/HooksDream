import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { UserCard } from './UserCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnfollowConfirm } from '@/contexts/UnfollowConfirmContext';
import { Profile } from '@/store/useAppStore'; 

interface FollowerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserId: string;
  type: 'followers' | 'following';
  onFollowUpdate?: (type: 'followers' | 'following', delta: number) => void;
}

export const FollowerListModal: React.FC<FollowerListModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUserId,
  type,
  onFollowUpdate
}) => {
  const queryClient = useQueryClient();
  const { showUnfollowConfirm } = useUnfollowConfirm();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('user_hash_id') || '';

  // Fetch users list
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      const endpoint = type === 'followers' 
        ? `${API_BASE_URL}/api/users/${userId}/followers`
        : `${API_BASE_URL}/api/users/${userId}/following`;

      const response = await fetch(endpoint, { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } 
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.data || data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch current user's following list
  const { data: currentUserFollowing } = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/following`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.data || data;
    },
    enabled: isOpen && !!currentUserId,
    staleTime: 5 * 60 * 1000,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      return response.json();
    },
    onSuccess: (result, targetUserId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [type, userId] });
        queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      }
    },
  });

  const getUserId = (user: any): string => {
    return user._id || user.id || '';
  };

  // Kết hợp dữ liệu để có trạng thái isFollowing chính xác
  const usersWithStatus = React.useMemo(() => {
    if (!usersData || !Array.isArray(usersData)) {
      return [];
    }

    // Get following IDs with better error handling - use Set for O(1) lookup
    const currentUserFollowingIds = new Set(
      currentUserFollowing && Array.isArray(currentUserFollowing) 
        ? currentUserFollowing.map((user: any) => getUserId(user)).filter(Boolean)
        : []
    );
    
    const processedUsers = usersData.map((user: any) => {
      const userId = getUserId(user);
      const isFollowing = currentUserFollowingIds.has(userId);
      const isOwnProfile = userId === currentUserId;
      
      return {
        ...user,
        // Ensure consistent ID fields
        _id: user._id || user.id,
        id: user.id || user._id,
        // Ensure required fields exist
        username: user.username || user.name || 'user',
        displayName: user.displayName || user.name || user.username || 'User',
        name: user.name || user.displayName || user.username || 'User',
        isFollowing,
        isOwnProfile
      };
    });

    return processedUsers;
  }, [usersData, currentUserFollowing, currentUserId]);

  // Refetch khi modal mở
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleFollowToggle = async (targetUserId: string, targetUsername: string) => {
    const userToUpdate = usersWithStatus.find((user: any) => getUserId(user) === targetUserId);
    if (!userToUpdate) return;

    const wasFollowing = userToUpdate.isFollowing;
    
    // Nếu đang unfollow, hiển thị dialog xác nhận
    if (wasFollowing) {
      showUnfollowConfirm(
        targetUsername,
        async () => {
          // Optimistic update
          const previousUsers = queryClient.getQueryData([type, userId]);
          queryClient.setQueryData([type, userId], (old: any[]) => 
            old?.map(user =>
              getUserId(user) === targetUserId 
                ? { ...user, isFollowing: false }
                : user
            ) || []
          );

          try {
            await followMutation.mutateAsync(targetUserId);
            
            if (onFollowUpdate) {
              onFollowUpdate(type, -1);
            }
          } catch (error) {
            // Rollback trên error
            queryClient.setQueryData([type, userId], previousUsers);
            console.error('⚠ Follow failed:', error);
          }
        }
      );
    } else {
      // Follow bình thường (không cần xác nhận)
      // Optimistic update
      const previousUsers = queryClient.getQueryData([type, userId]);
      queryClient.setQueryData([type, userId], (old: any[]) => 
        old?.map(user =>
          getUserId(user) === targetUserId 
            ? { ...user, isFollowing: true }
            : user
        ) || []
      );

      try {
        await followMutation.mutateAsync(targetUserId);
        
        if (onFollowUpdate) {
          onFollowUpdate(type, 1);
        }
      } catch (error) {
        // Rollback trên error
        queryClient.setQueryData([type, userId], previousUsers);
        console.error('⚠ Follow failed:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg w-[92vw] md:w-full mx-auto rounded-2xl md:rounded-lg">
        <DialogTitle className="text-center text-base md:text-xl font-medium pb-2 md:pb-4">
          {type === 'followers' ? 'Followers' : 'Following'}
        </DialogTitle>
        
        {/* Mobile: chiều cao nhỏ hơn, desktop giữ nguyên */}
        <div className="max-h-[70vh] md:max-h-96 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 md:space-x-4 sm:space-x-1.5 p-4 md:p-4 sm:p-2">
                {/* Skeleton avatar rất nhỏ trên mobile */}
                <Skeleton className="h-12 w-12 md:h-12 md:w-12 sm:h-7 sm:w-7 rounded-full flex-shrink-0" />
                <div className="space-y-1 sm:space-y-0.5 flex-1 min-w-0">
                  <Skeleton className="h-4 sm:h-2.5 w-full md:w-[250px] max-w-[160px]" />
                  <Skeleton className="h-4 sm:h-2 w-3/4 md:w-[200px] max-w-[120px]" />
                </div>
                <Skeleton className="h-6 w-12 sm:h-5 sm:w-10 rounded-full flex-shrink-0" />
              </div>
            ))
          ) : error ? (
            <div className="text-center text-red-500 py-4 text-sm md:text-base">
              {error instanceof Error ? error.message : 'Server error'}
            </div>
          ) : usersWithStatus.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 md:py-4 text-sm md:text-base">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            <div className="space-y-1 md:space-y-0">
              {usersWithStatus.map((user: any) => (
                <UserCard
                  key={getUserId(user)}
                  user={user}
                  onFollowToggle={() => handleFollowToggle(getUserId(user), user.username || user.name || '')}
                  showFollowButton={!user.isOwnProfile}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};