// src/components/posts/PostLikesSheet.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Profile } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUnfollowConfirm } from '@/contexts/UnfollowConfirmContext';
import { UserCard } from '@/components/profile/index/UserCard';
import { X, Heart } from 'lucide-react';

interface PostLikesSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  trigger?: React.ReactNode;
}

interface LikeUser extends Profile {
  likedAt: string;
  isFollowing?: boolean;
}

export const PostLikesSheet: React.FC<PostLikesSheetProps> = ({
  postId,
  open,
  onOpenChange,
  currentUserId,
  trigger
}) => {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const { showUnfollowConfirm } = useUnfollowConfirm();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('user_hash_id') || '';

  // Fetch likes list with better caching
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
    staleTime: 10 * 60 * 1000, // Increase cache time
    gcTime: 15 * 60 * 1000, // Keep in cache longer
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // Fetch current user's following list with better caching
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
    staleTime: 15 * 60 * 1000, // Longer cache for following list
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
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
  const usersWithStatus = useMemo(() => {
    if (!likesData) return [];

    // Nếu không có currentUserFollowing, vẫn hiển thị users nhưng không có follow status
    const currentUserFollowingIds = currentUserFollowing 
      ? (currentUserFollowing as Profile[]).map((user: Profile) => user._id)
      : [];

    return (likesData as LikeUser[]).map((user: LikeUser) => ({
      ...user,
      isFollowing: currentUserFollowingIds.includes(user._id),
      isOwnProfile: user._id === currentUserId
    }));
  }, [likesData, currentUserFollowing, currentUserId]);

  // Optimized refetch - only when really needed
  const debouncedRefetch = useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        refetch();
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [open, refetch]);

  useEffect(() => {
    if (open) {
      debouncedRefetch();
    }
  }, [open, debouncedRefetch]);

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
      }
    }
  };

  const defaultTrigger = (
    <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
      <Heart className="w-4 h-4 text-red-500 fill-current" />
      <span className="text-sm">{t('postCard.likes')}</span>
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[70vh] max-h-[70vh] rounded-t-xl border-t border-border/20 p-0 overflow-hidden will-change-transform transform-gpu"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-2 text-lg font-semibold">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <span>
                {t('postCard.likes')}
                {usersWithStatus.length > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    ({usersWithStatus.length})
                  </span>
                )}
              </span>
            </SheetTitle>
            
            <SheetClose asChild>
              <button 
                className="p-2 hover:bg-accent rounded-full transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-behavior-y-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            willChange: 'scroll-position'
          }}
        >
          {isLoading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-4 w-full max-w-[250px]" />
                    <Skeleton className="h-3 w-3/4 max-w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8 px-4">
              {error instanceof Error ? error.message : 'Server error'}
            </div>
          ) : usersWithStatus.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>{t('postCard.noLikes')}</p>
            </div>
          ) : (
            <div className="space-y-0">
              {usersWithStatus.map((user: Profile) => (
                <div key={user._id} className="border-b border-border/10 last:border-b-0">
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
      </SheetContent>
    </Sheet>
  );
};

export default PostLikesSheet;
