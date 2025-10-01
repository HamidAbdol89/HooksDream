// src/components/posts/PostActions.tsx - Clean version with CommentSheet
import React, { useState, useCallback, memo, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Archive, Trash2, Edit, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useCommentCount } from '@/hooks/useCommentCount';
import { useTranslation } from "react-i18next";
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';
import { CommentSheet } from '@/components/comment/CommentSheet';
import { RepostButton } from '@/components/ui/RepostButton';
import { Button } from '@/components/ui/Button';
import { useSuccessToast } from '@/components/ui/SuccessToast';
import { PostActionDialogs } from './PostActionDialogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface PostActionsProps {
  post: Post;
  isBookmarked: boolean;
  onLike: () => Promise<void> | void;
  onShare?: () => void;
  onBookmark: () => void;
  currentUser?: UserProfile;
  onRepostSuccess?: (repost: any) => void;
  // Dropdown actions
  isOwnProfile?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = memo(({
  post,
  isBookmarked,
  onLike,
  onShare,
  onBookmark,
  currentUser,
  onRepostSuccess,
  isOwnProfile = false,
  onArchive,
  onDelete,
  onEdit,
  onReport
}) => {
  const { t } = useTranslation("common");
  const { showSuccess } = useSuccessToast();
  const [isLiking, setIsLiking] = useState(false);
  const isMobile = useIsMobile();
  
  // Dialog states
  const [dialogs, setDialogs] = useState({
    archive: false,
    delete: false,
    report: false
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    archiving: false,
    deleting: false,
    reporting: false
  });
  
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

  // Dialog handlers
  const openDialog = useCallback((type: 'archive' | 'delete' | 'report') => {
    setDialogs(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeDialog = useCallback((type: 'archive' | 'delete' | 'report') => {
    setDialogs(prev => ({ ...prev, [type]: false }));
  }, []);

  // Action handlers with toast
  const handleArchiveConfirm = useCallback(async () => {
    if (!onArchive) return;
    
    setLoading(prev => ({ ...prev, archiving: true }));
    try {
      await onArchive();
      showSuccess(
        t('post.archiveSuccess', 'Post archived successfully!'),
        t('post.archiveSuccessDesc', 'You can restore it from your archived posts.')
      );
    } catch (error) {
      console.error('Archive error:', error);
    } finally {
      setLoading(prev => ({ ...prev, archiving: false }));
    }
  }, [onArchive, showSuccess, t]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!onDelete) return;
    
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      await onDelete();
      showSuccess(
        t('post.deleteSuccess', 'Post deleted successfully!'),
        t('post.deleteSuccessDesc', 'Your post has been permanently deleted.')
      );
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  }, [onDelete, showSuccess, t]);

  const handleReportConfirm = useCallback(async () => {
    if (!onReport) return;
    
    setLoading(prev => ({ ...prev, reporting: true }));
    try {
      await onReport();
      showSuccess(
        t('post.reportSuccess', 'Post reported successfully!'),
        t('post.reportSuccessDesc', 'Thank you for helping keep our community safe.')
      );
    } catch (error) {
      console.error('Report error:', error);
    } finally {
      setLoading(prev => ({ ...prev, reporting: false }));
    }
  }, [onReport, showSuccess, t]);

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
        
        {/* Repost Button */}
        <RepostButton 
          post={post as any} 
          onRepostSuccess={onRepostSuccess}
          showCount={true}
        />
      </div>
      {/* Actions Menu (3 chấm) - thay thế bookmark */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwnProfile ? (
            <>
              {/* Archive option cho author */}
              {onArchive && (
                <DropdownMenuItem onClick={() => openDialog('archive')}>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('post.archive', 'Lưu trữ bài viết')}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('post.edit', 'Edit post')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => openDialog('delete')}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('post.delete', 'Delete post')}
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <>
              {/* Bookmark option cho non-author */}
              <DropdownMenuItem onClick={onBookmark}>
                <Bookmark className={cn(
                  "mr-2 h-4 w-4",
                  isBookmarked && "fill-current text-yellow-500"
                )} />
                {isBookmarked ? t('post.unbookmark', 'Bỏ lưu') : t('post.bookmark', 'Lưu bài viết')}
              </DropdownMenuItem>
              {onReport && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDialog('report')}>
                    <Flag className="mr-2 h-4 w-4" />
                    {t('post.report', 'Report post')}
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Dialogs */}
      <PostActionDialogs
        isArchiveOpen={dialogs.archive}
        onArchiveClose={() => closeDialog('archive')}
        onArchiveConfirm={handleArchiveConfirm}
        isArchiving={loading.archiving}
        
        isDeleteOpen={dialogs.delete}
        onDeleteClose={() => closeDialog('delete')}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={loading.deleting}
        
        isReportOpen={dialogs.report}
        onReportClose={() => closeDialog('report')}
        onReportConfirm={handleReportConfirm}
        isReporting={loading.reporting}
        
        postContent={post.content}
      />
    </div>
  );
});

PostActions.displayName = 'PostActions';
