// src/components/modals/ArchivedPostsModal.tsx
import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ArchivedPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchivedPostsModal: React.FC<ArchivedPostsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation('common');
  const [posts, setPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Fetch archived posts
  const fetchArchivedPosts = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching archived posts, page:', pageNum);
      
      const response = await api.post.getArchivedPosts({ page: pageNum, limit: 10 });
      console.log('📝 API Response:', response);
      
      if (response.success) {
        const newPosts = response.data;
        console.log('📋 Posts received:', newPosts.length);
        setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
        setHasMore(response.pagination?.hasMore || false);
        setPage(pageNum);
      } else {
        console.error('❌ API returned success: false', response);
      }
    } catch (error) {
      console.error('❌ Error fetching archived posts:', error);
      // Show user-friendly error
      alert('Không thể tải bài viết đã lưu trữ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Load posts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchArchivedPosts(1, true);
    }
  }, [isOpen]);

  // Restore post
  const handleRestore = async (postId: string) => {
    try {
      setRestoring(postId);
      const response = await api.post.restorePost(postId);
      
      if (response.success) {
        // Remove from archived list
        setPosts(prev => prev.filter(post => post._id !== postId));
        // Show success message
        alert(t('archivedPosts.restoreSuccess', 'Post restored successfully!'));
      }
    } catch (error) {
      console.error('Error restoring post:', error);
      alert(t('archivedPosts.restoreError', 'Failed to restore post. Please try again.'));
    } finally {
      setRestoring(null);
    }
  };

  // Load more posts
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchArchivedPosts(page + 1, false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {t('archivedPosts.title', 'Archived Posts')}
          </DialogTitle>
          <DialogDescription>
            {t('archivedPosts.description', 'Posts are automatically deleted after 30 days. You can restore them anytime before expiration.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {posts.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('archivedPosts.empty', 'No archived posts')}
              </h3>
              <p className="text-muted-foreground">
                {t('archivedPosts.emptyDesc', 'When you archive posts, they will appear here.')}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="border rounded-lg p-4 space-y-3">
                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.userId.avatar} alt={post.userId.displayName} />
                      <AvatarFallback>
                        {post.userId.displayName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{post.userId.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time remaining badge */}
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeRemaining(post.expiresAt)}
                  </Badge>
                </div>

                {/* Post Content */}
                <div className="text-sm line-clamp-3">
                  {post.content}
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.slice(0, 2).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt=""
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                    {post.images.length > 2 && (
                      <div className="bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        +{post.images.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span>{post.likesCount} likes</span>
                    <span>{post.commentsCount} comments</span>
                  </div>
                  <div className="text-xs">
                    {t('archivedPosts.archivedOn', 'Archived on')} {formatDate(post.archivedAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(post._id)}
                    disabled={restoring === post._id}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {restoring === post._id 
                      ? t('archivedPosts.restoring', 'Restoring...') 
                      : t('archivedPosts.restore', 'Restore')
                    }
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {hasMore && posts.length > 0 && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="text-sm"
              >
                {loading ? t('archivedPosts.loading', 'Loading...') : t('archivedPosts.loadMore', 'Load More')}
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading && posts.length === 0 && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('archivedPosts.loading', 'Loading...')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
