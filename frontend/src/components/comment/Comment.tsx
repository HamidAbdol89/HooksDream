// src/components/posts/Comment.tsx - SỬA LỖI
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useToast } from '@/components/ui/use-toast';

import { 
  Heart, 
  MessageSquare, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Reply,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentInput } from './CommentInput';
import { formatDistanceToNow } from 'date-fns';
import { UserProfile } from '@/types/user';
import { useCommentSocket } from '@/hooks/useSocket';

// Inline Edit Form Component
interface InlineEditFormProps {
  initialContent: string;
  initialImage?: string;
  onSave: (content: string, image?: string) => Promise<void>;
  onCancel: () => void;
}

const InlineEditForm: React.FC<InlineEditFormProps> = ({
  initialContent,
  initialImage,
  onSave,
  onCancel
}) => {
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(initialImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(content.trim(), image);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={3}
        disabled={isSubmitting}
      />
      {image && (
        <div className="relative">
          <img
            src={image}
            alt="Comment attachment"
            className="w-20 h-20 rounded-lg object-cover border"
          />
          <button
            type="button"
            onClick={() => setImage('')}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 text-xs"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};

interface CommentProps {
  comment: any;
  postId: string;
  onCommentUpdate: () => void;
currentUser?: UserProfile;
}

export const Comment: React.FC<CommentProps> = ({ 
  comment, 
  postId, 
  onCommentUpdate, 
  currentUser 
}) => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  
  // Real-time socket for smooth updates
  const { onCommentLiked, emitCommentLike } = useCommentSocket(postId);
  
  // Local state for optimistic updates
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount || 0);
  const [localIsLiked, setLocalIsLiked] = useState(comment.isLiked || false);

  // Listen for real-time like updates
  useEffect(() => {
    onCommentLiked((data) => {
      if (data.commentId === comment._id) {
        console.log('🔄 Real-time like update received:', data);
        setLocalLikeCount(data.likeCount);
        setLocalIsLiked(data.isLiked);
      }
    });
  }, [comment._id, onCommentLiked]);

  // Sync with prop changes
  useEffect(() => {
    setLocalLikeCount(comment.likeCount || 0);
    setLocalIsLiked(comment.isLiked || false);
  }, [comment.likeCount, comment.isLiked]);

  // THÊM KIỂM TRA AN TOÀN - QUAN TRỌNG!
  if (!comment || !comment.userId) {
    console.error('Invalid comment data:', comment);
    return null; // Hoặc hiển thị fallback UI
  }

  // More flexible user comparison for Google Auth
  const { profile: googleAuthProfile } = useGoogleAuth();
  const fallbackUser = currentUser || googleAuthProfile;
  const isOwnComment = !!(fallbackUser && comment.userId && (
    comment.userId._id === (fallbackUser as any)._id ||
    comment.userId._id === fallbackUser.id ||
    comment.userId._id === (fallbackUser as any).googleId ||
    String(comment.userId._id) === String(fallbackUser.id)
  ));

  const handleLike = async () => {
    console.log('handleLike called - currentUser:', currentUser);
    console.log('fallbackUser:', fallbackUser);
    
    if (!fallbackUser) {
      console.log('No user authenticated');
      toast({
        title: t('auth.loginRequired'),
        variant: 'destructive'
      });
      return;
    }
    
    // Optimistic update for instant UI feedback
    const newIsLiked = !localIsLiked;
    const newLikeCount = newIsLiked ? localLikeCount + 1 : Math.max(0, localLikeCount - 1);
    
    setLocalIsLiked(newIsLiked);
    setLocalLikeCount(newLikeCount);
    setIsLiking(true);
    
    // Emit to socket for real-time updates to other users
    emitCommentLike(comment._id, newIsLiked, newLikeCount);
    
    try {
      console.log('Liking comment:', { postId, commentId: comment._id });
      const response = await api.comments.likeComment(postId, comment._id);
      console.log('Like response:', response);
      
      // Update with server response (in case of discrepancy)
      if (response.success && response.data) {
        setLocalIsLiked(response.data.isLiked);
        setLocalLikeCount(response.data.likeCount);
      }
      
      onCommentUpdate();
    } catch (error) {
      console.error('Error liking comment:', error);
      
      // Revert optimistic update on error
      setLocalIsLiked(!newIsLiked);
      setLocalLikeCount(localLikeCount);
      
      toast({
        title: t('comment.likeError'),
        variant: 'destructive'
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.comments.deleteComment(postId, comment._id);
      onCommentUpdate();
      toast({
        title: t('comment.deleted'),
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: t('comment.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const loadReplies = async () => {
    try {
      const response = await api.comments.getReplies(comment._id, {
        page: 1,
        limit: 10
      });

      if (response.success) {
        setReplies(response.data);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && comment.replyCount > 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  // THÊM KIỂM TRA USER INFO
  const getUserInitial = () => {
    if (!comment.userId) return 'U';
    return comment.userId.displayName?.[0]?.toUpperCase() || 
           comment.userId.username?.[0]?.toUpperCase() || 
           'U';
  };

  const getUserName = () => {
    if (!comment.userId) return 'Unknown User';
    return comment.userId.displayName || comment.userId.username || 'Unknown User';
  };

  return (
    <div className="p-4 border-b border-border/30 last:border-b-0">
      {/* Comment Header */}
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          {/* THÊM AvatarImage để hiển thị ảnh đại diện */}
          <AvatarImage 
            src={comment.userId?.avatar} 
            alt={getUserName()}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-primary-foreground text-xs font-bold">
            {getUserInitial()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-foreground">
                {getUserName()}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnComment && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => setIsReplying(true)}>
                  <Reply className="w-4 h-4 mr-2" />
                  {t('comment.reply')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <div className="mt-2">
              <InlineEditForm
                initialContent={comment.content}
                initialImage={comment.image}
                onSave={async (content: string, image?: string) => {
                  try {
                    await api.comments.updateComment(postId, comment._id, {
                      content,
                      image
                    });
                    setIsEditing(false);
                    onCommentUpdate();
                    toast({
                      title: t('comment.updated'),
                    });
                  } catch (error) {
                    console.error('Error updating comment:', error);
                    toast({
                      title: t('comment.updateError'),
                      variant: 'destructive'
                    });
                  }
                }}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                {comment.content}
              </p>

              {comment.image && (
                <div className="mt-2">
                  <img
                    src={comment.image}
                    alt="Comment attachment"
                    className="w-32 h-32 rounded-lg object-cover border"
                  />
                </div>
              )}
            </>
          )}

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={`h-8 px-2 text-xs transition-all duration-300 ${
                  localIsLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={localIsLiked ? 'liked' : 'unliked'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={localIsLiked ? { 
                        scale: [1, 1.3, 1],
                        rotate: [0, 15, -10, 0]
                      } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <Heart className={`w-4 h-4 mr-1 transition-all duration-300 ${
                        localIsLiked ? 'fill-current text-red-500' : ''
                      }`} />
                    </motion.div>
                    <motion.span
                      key={localLikeCount}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {localLikeCount > 0 ? localLikeCount : t('common.like')}
                    </motion.span>
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(true)}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              <Reply className="w-4 h-4 mr-1" />
              {t('comment.reply')}
            </Button>

            {comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleReplies}
                className="h-8 px-2 text-xs text-muted-foreground"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {showReplies ? t('comment.hideReplies') : `${comment.replyCount} ${t('comment.replies')}`}
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3">
              <CommentInput
                postId={postId}
                parentCommentId={comment._id}
                onCommentCreated={() => {
                  setIsReplying(false);
                  onCommentUpdate();
                  // Refresh replies if they are currently shown
                  if (showReplies) {
                    loadReplies();
                  } else {
                    // Show replies after creating a new one
                    setShowReplies(true);
                    loadReplies();
                  }
                }}
                placeholder={t('comment.writeReply')}
                currentUser={currentUser}
              />
            </div>
          )}

          {/* Replies Section */}
          {showReplies && (
            <div className="mt-3 pl-6 border-l-2 border-border/20">
              {replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onCommentUpdate={onCommentUpdate}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};