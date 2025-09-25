// src/components/posts/PostActions.tsx - Enhanced Professional Version
import React, { useState, useCallback, memo, useMemo, useTransition } from 'react';
import { Heart, MessageCircle, Repeat, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useCommentCount } from '@/hooks/useCommentCount';
import { useTranslation } from "react-i18next";
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';
import { CommentDialog } from '@/components/comment/CommentDialog';
import '@/components/comment/CommentDialog.css';

// Add Framer Motion for smoother, dopamine-boosting animations
import { motion, AnimatePresence } from 'framer-motion';

interface PostActionsProps {
  post: Post;
  isBookmarked: boolean;
  onLike: () => Promise<void> | void;
  onShare?: () => void;
  onBookmark: () => void;
  currentUser?: UserProfile;
}

// Enhanced like animation with particle burst for dopamine hit
const LikeAnimation = memo(({ isLiking, isLiked }: { isLiking: boolean; isLiked: boolean }) => (
  <motion.div 
    className="relative"
    initial={false}
    animate={{ scale: isLiked ? 1.1 : 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <Heart 
      className={cn(
        "w-5 h-5 transition-colors duration-200",
        isLiked && "fill-current"
      )} 
    />
    <AnimatePresence>
      {isLiking && (
        <>
          <motion.div
            className="absolute inset-0 w-5 h-5 bg-red-500/30 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 w-5 h-5 bg-red-500/20 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          />
          {/* Dopamine burst: small hearts floating up */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ y: -20 - i * 5, opacity: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
            >
              <Heart className="w-3 h-3 text-red-500 fill-current" />
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  </motion.div>
));

LikeAnimation.displayName = 'LikeAnimation';

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
  const [isPending, startTransition] = useTransition();
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

const handleLike = useCallback(() => {
  if (isLiking || isPending) return;

  startTransition(() => {
    setIsLiking(true);
    // Run async operation outside of transition
    Promise.all([
      onLike(),
      new Promise(resolve => setTimeout(resolve, 400)) // Minimum duration for animation visibility
    ]).finally(() => {
      setIsLiking(false);
    });
  });
}, [isLiking, isPending, onLike]);

  // Memoized comment trigger for optimization
  const commentDialogTrigger = useMemo(() => (
    <motion.button 
      className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors"
      whileTap={{ scale: 0.95 }}
    >
      <MessageCircle className="w-5 h-5" />
      {commentCount > 0 && (
        <span className="font-medium text-sm tabular-nums">
          {isLoadingCommentCount ? '...' : formatCount(commentCount)}
        </span>
      )}
    </motion.button>
  ), [commentCount, isLoadingCommentCount, formatCount]);

  return (
    <div className="flex items-center justify-between touch-none select-none">
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Like Button with springy press and burst animation */}
        <motion.button
          onClick={handleLike}
          disabled={isLiking || isPending}
          className={cn(
            "flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200",
            post.isLiked ? "text-red-500" : "text-muted-foreground"
          )}
          whileTap={{ scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          aria-label={post.isLiked ? t('postCard.unlike') : t('postCard.like')}
        >
          <LikeAnimation isLiking={isLiking} isLiked={post.isLiked ?? false} />
          {post.likeCount > 0 && !isMobile && (
            <motion.span 
              className="font-medium text-sm tabular-nums"
              initial={false}
              animate={{ scale: isLiking ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatCount(post.likeCount)}
            </motion.span>
          )}
        </motion.button>
        
        {/* Comment Dialog */}
        <CommentDialog
          post={post}
          currentUser={currentUser}
          trigger={commentDialogTrigger}
        />
        
        {/* Repost Button with subtle animation */}
        <motion.button 
          onClick={onShare}
          className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          whileTap={{ scale: 0.95, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Repeat className="w-5 h-5" />
          {!isMobile && (
            post.shareCount && post.shareCount > 0 ? (
              <span className="font-medium text-sm tabular-nums">
                {formatCount(post.shareCount)}
              </span>
            ) : (
              <span className="font-medium text-sm">{t('postCard.repost')}</span>
            )
          )}
        </motion.button>
      </div>

      {/* Bookmark Button with fill animation */}
      <motion.button 
        onClick={onBookmark}
        className={cn(
          "p-1 hover:text-foreground transition-colors",
          isBookmarked ? "text-yellow-500" : "text-muted-foreground"
        )}
        whileTap={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Bookmark 
          className={cn(
            "w-5 h-5 transition-all duration-300",
            isBookmarked && "fill-current"
          )} 
        />
      </motion.button>
    </div>
  );
});

PostActions.displayName = 'PostActions';