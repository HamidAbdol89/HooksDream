// components/feed/VirtualPostList.tsx - High-Performance Virtual Scrolling Feed
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { PostCard } from '../posts/PostCard';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';

interface VirtualPostListProps {
  posts: Post[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onLike: (postId: string) => void;
  onFollow: (userId: string, currentStatus: boolean) => void;
  onPostUpdate?: (updatedPost: Post) => void;
  isFollowLoading: boolean;
  currentUserHashId?: string;
  currentUser?: UserProfile;
}

// Intersection Observer for auto-loading
const useInfiniteScroll = (
  hasMore: boolean,
  isLoadingMore: boolean,
  onLoadMore: () => void,
  threshold = 0.8
) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!target || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold, rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [target, hasMore, isLoadingMore, onLoadMore, threshold]);

  return setTarget;
};

// Post height estimation cache
const postHeightCache = new Map<string, number>();

// Estimate post height based on content
const estimatePostHeight = (post: Post): number => {
  if (!post || !post._id) return 400; // Fallback height
  
  const cacheKey = `${post._id}-${post.images?.length || 0}-${post.video ? 'video' : 'no-video'}`;
  
  if (postHeightCache.has(cacheKey)) {
    return postHeightCache.get(cacheKey)!;
  }

  let height = 180; // Base height (header + actions + padding)
  
  // Content height estimation
  if (post.content) {
    const lines = Math.ceil(post.content.length / 60);
    height += Math.min(lines * 24, 144); // Max 6 lines
  }
  
  // Media height estimation
  if (post.images && post.images.length > 0) {
    if (post.images.length === 1) {
      height += 400; // Single image
    } else if (post.images.length <= 4) {
      height += 320; // Grid layout
    } else {
      height += 360; // Grid with overlay
    }
  } else if (post.video) {
    height += 400; // Video player
  }
  
  // Comments preview
  if (post.commentCount && post.commentCount > 0) {
    height += 40; // Comments section
  }
  
  postHeightCache.set(cacheKey, height);
  return height;
};

export const VirtualPostList: React.FC<VirtualPostListProps> = ({
  posts,
  hasMore,
  isLoadingMore,
  isRefreshing,
  onLoadMore,
  onRefresh,
  onLike,
  onFollow,
  onPostUpdate,
  isFollowLoading,
  currentUserHashId,
  currentUser
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const setInfiniteScrollTarget = useInfiniteScroll(hasMore, isLoadingMore, onLoadMore);

  // Update container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Convert posts to virtual scroll items with safety checks
  const virtualItems = posts
    .filter(post => post && post._id) // Filter out invalid posts
    .map(post => ({
      id: post._id,
      data: post,
      height: estimatePostHeight(post)
    }));

  // Virtual scroll hook
  const {
    virtualItems: visibleItems,
    totalHeight,
    scrollToTop,
    isScrolling,
    visibleRange
  } = useVirtualScroll(virtualItems, {
    itemHeight: 400,
    overscan: 3,
    estimatedItemHeight: 400,
    getItemHeight: (index, item) => estimatePostHeight(item.data)
  });

  // Post card renderer with performance optimizations
  const renderPost = useCallback((virtualItem: any) => {
    const { item: post, index, start } = virtualItem;
    
    // Safety check
    if (!post || !post._id) {
      console.warn('Invalid post data in virtual list:', post);
      return null;
    }
    
    const isLastVisible = index === visibleRange.end;

    return (
      <div
        key={post._id}
        style={{
          position: 'absolute',
          top: start,
          left: 0,
          right: 0,
          minHeight: estimatePostHeight(post)
        }}
        ref={isLastVisible ? setInfiniteScrollTarget : undefined}
      >
        <div className="px-4 pb-6">
          <PostCard
            post={{
              ...post,
              userId: post.userId ? {
                ...post.userId,
                isFollowing: post.userId.isFollowing || false,
              } : {
                _id: 'unknown',
                username: 'unknown',
                displayName: 'Unknown User',
                isFollowing: false
              },
              commentCount: post.commentCount || 0
            }}
            onLike={() => onLike(post._id)}
            onFollow={() => post.userId && onFollow(
              post.userId._id, 
              post.userId.isFollowing || false
            )}
            onPostUpdate={onPostUpdate}
            isFollowLoading={isFollowLoading}
            currentUserHashId={currentUserHashId}
            currentUser={currentUser}
            // Performance props
            isVisible={true} // Always true for visible items
            priority={index < 3 ? 'high' : 'normal'} // High priority for first 3 posts
          />
        </div>
      </div>
    );
  }, [
    onLike,
    onFollow,
    onPostUpdate,
    isFollowLoading,
    currentUserHashId,
    currentUser,
    setInfiniteScrollTarget,
    visibleRange.end
  ]);

  // Scroll to top handler
  const handleScrollToTop = useCallback(() => {
    scrollToTop();
    onRefresh();
  }, [scrollToTop, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen">
      {/* Virtual container */}
      <div
        style={{
          height: Math.max(totalHeight, 800), // Minimum height to prevent black screen
          position: 'relative'
        }}
      >
        {/* Render visible posts */}
        {visibleItems.length > 0 ? (
          visibleItems.map(renderPost)
        ) : posts.length > 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <span className="text-sm">Đang tải bài viết...</span>
          </div>
        ) : null}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Đang tải thêm bài viết...</span>
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">Bạn đã xem hết tất cả bài viết!</p>
          <Button 
            variant="ghost"
            onClick={handleScrollToTop}
            className="mt-4 text-xs"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Về đầu trang và làm mới
          </Button>
        </div>
      )}

      {/* Debug panel removed for production */}
    </div>
  );
};
