import React, { useCallback, useRef, useState, useMemo } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useSocial } from '@/hooks/useSocial';
import { useTranslation } from 'react-i18next';
import { CreatePostModal } from '../posts/CreatePostModal';
import { FeedHeader } from './FeedHeader';
import { PostList } from './PostList';
import { VirtualPostList } from './VirtualPostList';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { debounce } from 'lodash-es';
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';

interface FeedContainerProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  currentUserProfile?: any;
  profile?: any;
  onRefresh: () => void;
  onLoadMore: () => void;
  onLike: (postId: string) => void;
  onFollow: (userId: string, currentStatus: boolean) => void;
  onPostCreated: (newPost: any) => void;
  onPostUpdate?: (updatedPost: Post) => void;
  isConnected: boolean;
  currentUserHashId?: string;
  currentUser?: UserProfile;
  // ✅ Performance option
  useVirtualScrolling?: boolean;
}

export const FeedContainer: React.FC<FeedContainerProps> = React.memo(({
  posts,
  loading,
  error,
  isRefreshing,
  hasMore,
  isLoadingMore,
  currentUserProfile,
  onRefresh,
  onLoadMore,
  onLike,
  onFollow,
  onPostCreated,
  onPostUpdate,
  currentUserHashId,
  useVirtualScrolling = false // ❌ Temporarily disable virtual scrolling for debugging
}) => {
  const { t } = useTranslation('common');
  const { profile } = useGoogleAuth();
  const { isFollowLoading } = useSocial();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver>();

  // Debounce infinite scroll để mobile không spam
  const debouncedLoadMore = useMemo(() => debounce(() => {
    if (hasMore && !isLoadingMore) onLoadMore();
  }, 200), [hasMore, isLoadingMore, onLoadMore]);

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) debouncedLoadMore();
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    observerRef.current.observe(node);
  }, [debouncedLoadMore]);

  const handleCreatePost = () => setIsCreateModalOpen(true);
  const handleCloseModal = () => setIsCreateModalOpen(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Overlay loading khi refresh hoặc load more */}
      {loading && posts.length > 0 && (
        <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center pointer-events-none">
          <LoadingState small />
        </div>
      )}

      <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl mx-auto">
        <FeedHeader
          currentUserProfile={currentUserProfile}
          profile={profile}
          onCreatePost={handleCreatePost}
        />

        <div className="pb-20">
          {error ? (
            <ErrorState error={error} onRetry={onRefresh} />
          ) : loading && posts.length === 0 ? (
            <LoadingState />
          ) : posts.length === 0 ? (
            <EmptyState onCreatePost={handleCreatePost} />
          ) : useVirtualScrolling ? (
            <VirtualPostList
              posts={posts}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              isRefreshing={isRefreshing}
              onLoadMore={onLoadMore}
              onRefresh={onRefresh}
              onLike={onLike}
              onFollow={onFollow}
              onPostUpdate={onPostUpdate}
              isFollowLoading={isFollowLoading}
              currentUserHashId={currentUserHashId}
              currentUser={currentUserProfile}
            />
          ) : (
            <PostList
              posts={posts}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              isRefreshing={isRefreshing}
              onLoadMore={onLoadMore}
              onRefresh={onRefresh}
              onLike={onLike}
              onFollow={onFollow}
              onPostUpdate={onPostUpdate}
              isFollowLoading={isFollowLoading}
              lastPostRef={lastPostElementRef}
              currentUserHashId={currentUserHashId}
              currentUser={currentUserProfile}
            />
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onPostCreated={onPostCreated}
      />
    </div>
  );
});