// src/components/modals/MobileArchivedPostsOverlay.tsx
import React, { useState } from 'react';
import { Archive, RotateCcw, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useArchivedPosts } from '@/hooks/useArchivedPosts';
import { useSuccessToast } from '@/components/ui/SuccessToast';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';

interface ArchivedPost {
  _id: string;
  content: string;
  userId: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  archivedAt: string;
  expiresAt: string;
  likesCount: number;
  commentsCount: number;
  images?: string[];
}

interface MobileArchivedPostsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileArchivedPostsOverlay: React.FC<MobileArchivedPostsOverlayProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation('common');
  const { showSuccess } = useSuccessToast();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    postId: string;
    postContent: string;
  }>({
    isOpen: false,
    postId: '',
    postContent: ''
  });
  
  // Use the optimized hook
  const {
    posts,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    restorePost,
    isRestoring,
    refetch
  } = useArchivedPosts();

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Show restore confirmation dialog
  const handleRestoreClick = (post: ArchivedPost) => {
    setConfirmDialog({
      isOpen: true,
      postId: post._id,
      postContent: post.content
    });
  };

  // Confirm restore post
  const handleConfirmRestore = () => {
    const { postId } = confirmDialog;
    restorePost(postId, {
      onSuccess: () => {
        showSuccess(
          t('archivedPosts.restoreSuccess', 'Post restored successfully!'),
          t('archivedPosts.restoreSuccessDesc', 'Your post is now visible in your feed.')
        );
      },
      onError: () => {
        showSuccess(
          t('archivedPosts.restoreError', 'Failed to restore post'),
          t('archivedPosts.restoreErrorDesc', 'Please try again later.')
        );
      }
    });
  };

  // Close confirmation dialog
  const handleCloseDialog = () => {
    setConfirmDialog({
      isOpen: false,
      postId: '',
      postContent: ''
    });
  };

  // Load more posts
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Format time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return t('archivedPosts.expired', 'Expired');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return t('archivedPosts.daysLeft', `${days} days left`, { days });
    } else if (hours > 0) {
      return t('archivedPosts.hoursLeft', `${hours} hours left`, { hours });
    } else {
      return t('archivedPosts.lessThanHour', 'Less than 1 hour');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{t('archivedPosts.title', 'Archived Posts')}</h1>
              <p className="text-xs text-muted-foreground">
                {totalCount} {t('archivedPosts.items', 'posts')}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        <div className="px-4 py-3 bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            {t('archivedPosts.description', 'Posts are automatically deleted after 30 days. You can restore them anytime before expiration.')}
          </p>
        </div>

        {/* Posts List */}
        <div className="px-4 py-2 space-y-3">
          {posts.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('archivedPosts.empty', 'No archived posts')}
              </h3>
              <p className="text-muted-foreground text-sm px-8">
                {t('archivedPosts.emptyDesc', 'When you archive posts, they will appear here.')}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-card border rounded-xl p-4 space-y-3">
                {/* Post Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={post.userId.avatar} alt={post.userId.displayName} />
                      <AvatarFallback>
                        {post.userId.displayName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{post.userId.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time remaining badge */}
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeRemaining(post.expiresAt)}
                  </Badge>
                </div>

                {/* Post Content */}
                <div className="text-sm leading-relaxed">
                  {post.content}
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt=""
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 3 && post.images!.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              +{post.images!.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <span>{post.likesCount} likes</span>
                    <span>{post.commentsCount} comments</span>
                  </div>
                  <div className="text-xs">
                    {formatDate(post.archivedAt)}
                  </div>
                </div>

                {/* Restore Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreClick(post)}
                    disabled={isRestoring}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isRestoring 
                      ? t('archivedPosts.restoring', 'Restoring...') 
                      : t('archivedPosts.restore', 'Restore')
                    }
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {hasNextPage && posts.length > 0 && (
            <div className="py-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="w-full"
              >
                {isFetchingNextPage ? t('archivedPosts.loading', 'Loading...') : t('archivedPosts.loadMore', 'Load More')}
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('archivedPosts.loading', 'Loading...')}</p>
            </div>
          )}
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-8"></div>
      </div>

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmRestore}
        isLoading={isRestoring}
        postContent={confirmDialog.postContent}
      />
    </div>
  );
};
