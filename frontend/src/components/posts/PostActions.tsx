// src/components/posts/PostActions.tsx - Clean version with CommentSheet
import React, { useState, useCallback, memo, useMemo } from 'react';
import { Heart, MessageCircle, Repeat, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useCommentCount } from '@/hooks/useCommentCount';
import { useTranslation } from "react-i18next";
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';
import { CommentSheet } from '@/components/comment/CommentSheet';

interface PostActionsProps {
  post: Post;
  isBookmarked: boolean;
  onLike: () => Promise<void> | void;
  onShare?: () => void;
  onBookmark: () => void;
  currentUser?: UserProfile;
}

export const PostActions: React.FC<PostActionsProps> = memo(({
  post,
  isBookmarked,
  onLike,
  onShare,
  onBookmark,
  currentUser
}) => {
  const { t } = useTranslation("common");
  const [isLiking, setIsLiking] = useState(false);
  const isMobile = useIsMobile();
  
  // Use custom hook for comment count
  const { commentCount, isLoading: isLoadingCommentCount } = useCommentCount(
    post._id, 
    post.commentCount
  );

  // Memoized count formatter
  const formatCount = useCallback((count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }, []);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await onLike();
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, onLike]);

  // Memoized comment trigger for optimization
  const commentTrigger = useMemo(() => (
    <button className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors">
      <MessageCircle className="w-5 h-5" />
      {commentCount > 0 && (
        <span className="font-medium text-sm tabular-nums">
          {isLoadingCommentCount ? '...' : formatCount(commentCount)}
        </span>
      )}
    </button>
  ), [commentCount, isLoadingCommentCount, formatCount]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={cn(
            "flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200",
            post.isLiked ? "text-red-500" : "text-muted-foreground"
          )}
          aria-label={post.isLiked ? t('postCard.unlike') : t('postCard.like')}
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-colors duration-200",
              post.isLiked && "fill-current"
            )} 
          />
        </button>
        
        {/* Comment Sheet */}
        <CommentSheet
          post={post}
          currentUser={currentUser}
          commentCount={commentCount}
          trigger={commentTrigger}
        />
        
        {/* Share Button */}
        <button 
          onClick={onShare}
          className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Repeat className="w-5 h-5" />
          {!isMobile && post.shareCount && post.shareCount > 0 && (
            <span className="font-medium text-sm tabular-nums">
              {formatCount(post.shareCount)}
            </span>
          )}
        </button>
      </div>

      {/* Bookmark Button */}
      <button 
        onClick={onBookmark}
        className={cn(
          "p-1 hover:text-foreground transition-colors",
          isBookmarked ? "text-yellow-500" : "text-muted-foreground"
        )}
      >
        <Bookmark 
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            isBookmarked && "fill-current"
          )} 
        />
      </button>
    </div>
  );
});

PostActions.displayName = 'PostActions';
