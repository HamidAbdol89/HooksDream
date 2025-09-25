// src/components/posts/CommentSection.tsx - Updated
import React, { useState, useEffect } from 'react';
import { Comment } from './Comment';
import { CommentInput } from './CommentInput';
import { api } from '@/services/api';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types/user';
import { useCommentSocket } from '@/hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Comment as CommentType } from '@/components/comment/types/comment'; 

interface CommentSectionProps {
  postId: string;
  currentUser?: UserProfile;
  showInput?: boolean; // New prop to control input display
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  currentUser,
  showInput = true // Default to true for backward compatibility
}) => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Socket.IO for real-time updates
  const { onCommentCreated, onCommentDeleted, onReplyCreated } = useCommentSocket(postId);

  const loadComments = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await api.comments.getComments(postId, {
        page: pageNum,
        limit: 10
      });

      if (response.success && Array.isArray(response.data)) {
        const validComments = response.data.filter((comment: CommentType) => 
          comment && comment.userId && comment._id
        );
        
        if (append) {
          setComments(prev => [...prev, ...validComments]);
        } else {
          setComments(validComments);
        }
        
        setHasMore(response.data.length === 10);
        
        if (!append) {
          setPage(1);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: t('comment.loadError'),
        description: t('comment.loadErrorDesc'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadComments(1, false);
  }, [postId]);

  // Socket.IO real-time listeners
  useEffect(() => {
    // Listen for new comments
    onCommentCreated((data) => {
      console.log('🔄 Real-time comment created:', data);
      if (data.postId === postId) {
        // Add new comment to the beginning of the list
        setComments(prev => [data.comment, ...prev]);
      }
    });

    // Listen for comment deletions
    onCommentDeleted((data) => {
      console.log('🔄 Real-time comment deleted:', data);
      if (data.postId === postId) {
        setComments(prev => prev.filter(comment => comment._id !== data.commentId));
      }
    });

    // Listen for new replies
    onReplyCreated((data) => {
      console.log('🔄 Real-time reply created:', data);
      if (data.postId === postId) {
        // Refresh comments to show new reply count
        loadComments(1, false);
      }
    });
  }, [postId, onCommentCreated, onCommentDeleted, onReplyCreated]);

  // Listen for comment created events
  useEffect(() => {
    const handleCommentCreated = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        loadComments(1, false);
        setPage(1);
      }
    };

    window.addEventListener('commentCreated', handleCommentCreated as EventListener);
    return () => {
      window.removeEventListener('commentCreated', handleCommentCreated as EventListener);
    };
  }, [postId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    loadComments(nextPage, true);
  };

  const handleCommentCreated = () => {
    loadComments(1, false);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comment Input - Only show if showInput is true */}
      {showInput && (
        <div className="p-4 border-b border-border/30">
          <CommentInput
            postId={postId}
            onCommentCreated={handleCommentCreated}
            placeholder={t('comment.addComment')}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          <div className="space-y-1">
            {comments.map((comment, index) => (
              comment && comment.userId && comment._id ? (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100
                  }}
                  layout
                >
                  <Comment
                    comment={comment}
                    postId={postId}
                    onCommentUpdate={handleCommentCreated}
                    currentUser={currentUser}
                  />
                </motion.div>
              ) : null
            ))}
          </div>
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t('comment.loadMore')}
            </Button>
          </div>
        )}

        {comments.length === 0 && !loading && (
          <div className="p-8 text-center text-muted-foreground">
            {t('comment.noComments')}
          </div>
        )}
      </div>
    </div>
  );
};