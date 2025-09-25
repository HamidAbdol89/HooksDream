// src/components/posts/PostLikesDialog.tsx
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Profile } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUnfollowConfirm } from '@/contexts/UnfollowConfirmContext';
import { UserCard } from '@/components/profile/index/UserCard';
import { X, Heart } from 'lucide-react';
import '@/components/posts/PostLikesDialog.css';

interface PostLikesDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

interface LikeUser extends Profile {
  likedAt: string;
  isFollowing?: boolean;
}

export const PostLikesDialog: React.FC<PostLikesDialogProps> = ({
  postId,
  open,
  onOpenChange,
  currentUserId
}) => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const { showUnfollowConfirm } = useUnfollowConfirm();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('user_hash_id') || '';

  // Fetch likes list
  const { data: likesData, isLoading, error, refetch } = useQuery({
    queryKey: ['postLikes', postId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/likes`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.data || data;
    },
    enabled: open,
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
    enabled: open && !!currentUserId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['postLikes', postId] });
    },
  });

  // Kết hợp dữ liệu để có trạng thái isFollowing chính xác
  const usersWithStatus = React.useMemo(() => {
    if (!likesData || !currentUserFollowing) return [];

    const currentUserFollowingIds = (currentUserFollowing as Profile[]).map((user: Profile) => user._id);

    return (likesData as LikeUser[]).map((user: LikeUser) => ({
      ...user,
      isFollowing: currentUserFollowingIds.includes(user._id),
      isOwnProfile: user._id === currentUserId
    }));
  }, [likesData, currentUserFollowing, currentUserId]);

  // Refetch khi dialog mở
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleFollowToggle = async (targetUserId: string, targetUsername: string) => {
    if (!currentUserId) return;
    
    const userToUpdate = usersWithStatus.find((user: Profile) => user._id === targetUserId);
    if (!userToUpdate) return;

    const wasFollowing = userToUpdate.isFollowing;
    
    // Nếu đang unfollow, hiển thị dialog xác nhận
    if (wasFollowing) {
      showUnfollowConfirm(
        targetUsername,
        async () => {
          // Optimistic update
          const previousUsers = queryClient.getQueryData(['postLikes', postId]);
          queryClient.setQueryData(['postLikes', postId], (old: LikeUser[]) => 
            old.map(user =>
              user._id === targetUserId 
                ? { ...user, isFollowing: false }
                : user
            )
          );

          try {
            await followMutation.mutateAsync(targetUserId);
          } catch (error) {
            // Rollback trên error
            queryClient.setQueryData(['postLikes', postId], previousUsers);
            console.error('⚠ Follow failed:', error);
          }
        }
      );
    } else {
      // Follow bình thường (không cần xác nhận)
      // Optimistic update
      const previousUsers = queryClient.getQueryData(['postLikes', postId]);
      queryClient.setQueryData(['postLikes', postId], (old: LikeUser[]) => 
        old.map(user =>
          user._id === targetUserId 
            ? { ...user, isFollowing: true }
            : user
        )
      );

      try {
        await followMutation.mutateAsync(targetUserId);
      } catch (error) {
        // Rollback trên error
        queryClient.setQueryData(['postLikes', postId], previousUsers);
        console.error('⚠ Follow failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="post-likes-dialog sm:max-w-lg sm:w-[90vw] lg:max-w-xl lg:w-[80vw] xl:max-w-2xl xl:w-[75vw] sm:max-h-[80vh] lg:max-h-[85vh] max-w-full max-h-full w-full h-full sm:w-auto sm:h-auto p-0 gap-0 sm:rounded-xl">
        {/* Header */}
<DialogHeader className="relative flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 border-b border-border/30 shrink-0">
  {/* Title */}
  <DialogTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-xl font-semibold">
    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-current" />
    <span>{t('postCard.likes')}</span>
    {usersWithStatus.length > 0 && (
      <span className="text-xs sm:text-base text-muted-foreground font-normal">
        ({usersWithStatus.length})
      </span>
    )}
  </DialogTitle>

 
</DialogHeader>




        {/* Content */}
        <div className="post-likes-dialog-content flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2 sm:p-0">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 sm:p-4">
                  <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-3 sm:h-4 w-full max-w-[160px] sm:max-w-[250px]" />
                    <Skeleton className="h-2 sm:h-3 w-3/4 max-w-[120px] sm:max-w-[200px]" />
                  </div>
                  <Skeleton className="h-6 w-16 sm:h-8 sm:w-20 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8 text-sm sm:text-base">
              {error instanceof Error ? error.message : 'Server error'}
            </div>
          ) : usersWithStatus.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm sm:text-base">
              <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>{t('postCard.noLikes')}</p>
            </div>
          ) : (
            <div className="space-y-0">
              {usersWithStatus.map((user: Profile, index) => (
                <div
                  key={user._id}
                  className="user-card-item opacity-0"
                  style={{
                    animationDelay: `${0.1 + index * 0.05}s`
                  }}
                >
                  <UserCard
                    user={user}
                    onFollowToggle={() => handleFollowToggle(user._id, user.username)}
                    showFollowButton={!user.isOwnProfile && !!currentUserId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};