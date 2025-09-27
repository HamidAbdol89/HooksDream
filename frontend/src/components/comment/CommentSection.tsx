// src/components/comment/CommentSection.tsx - Clean version with shimmer loading
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Comment } from './Comment';
import { CommentInput } from './CommentInput';
import { api } from '@/services/api';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Comment as CommentType } from '@/components/comment/types/comment';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface CommentSectionProps {
  postId: string;
  currentUser?: UserProfile;
  showInput?: boolean;
}

// Mobile-first shimmer loading component
const CommentSkeleton = () => (
  <div className="flex space-x-2 sm:space-x-3 p-2 sm:p-4 animate-pulse">
    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-1 sm:space-y-2">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
        <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16" />
      </div>
      <Skeleton className="h-3 sm:h-4 w-full max-w-xs sm:max-w-md" />
      <Skeleton className="h-3 sm:h-4 w-2/3 max-w-48 sm:max-w-sm" />
      <div className="flex space-x-3 sm:space-x-4 mt-1.5 sm:mt-2">
        <Skeleton className="h-4 sm:h-6 w-8 sm:w-12" />
        <Skeleton className="h-4 sm:h-6 w-10 sm:w-12" />
      </div>
    </div>
  </div>
);

// Batch loading shimmer
const BatchLoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-0">
    {Array.from({ length: count }).map((_, i) => (
      <CommentSkeleton key={i} />
    ))}
  </div>
);

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  currentUser,
  showInput = true
}) => {
  const { t } = useTranslation('common');
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load initial comments with debouncing
  const loadComments = useCallback(async (pageNum = 1, append = false, isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await api.comments.getComments(postId, {
        page: pageNum,
        limit: 10
      });

      if (response.success) {
        const newComments = response.data || [];
        
        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        
        setHasMore(newComments.length === 10);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [postId]);

  // Load more comments (pagination) with debouncing
  const loadMoreComments = useDebouncedCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadComments(nextPage, true);
    }
  }, 300);

  // Refresh comments with debouncing - không hiện shimmer
  const refreshComments = useDebouncedCallback(() => {
    setPage(1);
    loadComments(1, false, true); // isRefresh = true
  }, 200);

  // Initial load
  useEffect(() => {
    loadComments(); // Chỉ hiện shimmer lần đầu load
  }, [loadComments]);

  // Chỉ hiện shimmer khi thực sự loading lần đầu, không phải khi refresh
  if (loading && !isRefreshing) {
    return (
      <div className="mt-4">
        <BatchLoadingSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Comment Input */}
      {showInput && (
        <div className="mb-4">
          <CommentInput
            postId={postId}
            onCommentCreated={refreshComments}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Comments List - Optimized rendering */}
      <div className="space-y-0 comment-list">
        {comments.map((comment) => (
          <div key={comment._id} className="border-b border-border/10 last:border-b-0 comment-item">
            <Comment
              comment={comment}
              postId={postId}
              onCommentUpdate={refreshComments}
              currentUser={currentUser}
            />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && comments.length > 0 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={loadMoreComments}
            disabled={isLoadingMore}
            className="text-muted-foreground hover:text-foreground"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('comment.loadMore')
            )}
          </Button>
        </div>
      )}

      {/* Loading more shimmer */}
      {isLoadingMore && (
        <BatchLoadingSkeleton count={3} />
      )}
      
      {/* Subtle refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('comment.noComments')}</p>
        </div>
      )}
    </div>
  );
};
