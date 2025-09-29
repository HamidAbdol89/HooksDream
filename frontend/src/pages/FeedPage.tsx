// src/pages/Feed.tsx - CACHED VERSION with React Query + Scroll Restoration
import React, { useCallback, useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useSocial } from '@/hooks/useSocial';
import { FeedContainer } from '@/components/feed/Feed';
import { useFeedQuery, useFeedActions } from '@/hooks/useFeedQuery';
import { useFeedScrollRestoration } from '@/hooks/useScrollRestoration';
import { useTranslation } from 'react-i18next';
import { Post } from '@/types/post';

export const Feed: React.FC = () => {
  const { isConnected, profile } = useGoogleAuth();
  const { useCurrentProfile, toggleFollow, isFollowLoading } = useSocial();
  const { data: currentProfileData, isLoading: isCurrentProfileLoading } = useCurrentProfile();
  const currentUserProfile = currentProfileData?.data;
  const { t } = useTranslation('common');

  // ✅ Use cached feed query instead of manual state management
  const {
    posts,
    isLoading,
    isLoadingMore,
    isError,
    error,
    hasMore,
    loadMore,
    likePost,
    deletePost,
    refresh,
    isLiking,
    isDeleting
  } = useFeedQuery();

  const { addNewPost } = useFeedActions();

  // ✅ Scroll restoration for better UX
  const { restoreFeedScroll, hasScrollPosition } = useFeedScrollRestoration();

  // ✅ Restore scroll position when data is loaded
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      // Small delay to ensure DOM is rendered
      const timeoutId = setTimeout(() => {
        restoreFeedScroll(true);
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, posts.length, restoreFeedScroll]);

  // ✅ Enhanced follow handler with optimistic updates
  const handleFollowUser = useCallback(async (userId: string, currentStatus: boolean) => {
    if (!isConnected || isFollowLoading) return;
    
    try {
      await toggleFollow(userId, currentStatus);
    } catch (err) {
      console.error('Follow error:', err);
    }
  }, [isConnected, isFollowLoading, toggleFollow]);

  const handlePostCreated = useCallback((newPost: Post) => {
    addNewPost(newPost);
  }, [addNewPost]);

  const handlePostUpdate = useCallback((updatedPost: Post) => {
    // This will be handled by React Query cache invalidation
    refresh();
  }, [refresh]);

  const currentUserHashId = localStorage.getItem('user_hash_id') || undefined;

  return (
    <FeedContainer
      currentUserHashId={currentUserHashId} 
      posts={posts}
      loading={isLoading || isCurrentProfileLoading}
      error={isError ? (error?.message || 'Failed to load feed') : null}
      isRefreshing={false} // React Query handles this internally
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      currentUserProfile={currentUserProfile}
      onRefresh={refresh}
      onLoadMore={loadMore}
      onLike={likePost}
      onFollow={handleFollowUser}
      onPostCreated={handlePostCreated}
      onPostUpdate={handlePostUpdate}
      profile={profile}
      isConnected={isConnected}
    />
  );
};
