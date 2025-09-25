// src/components/posts/CommentInput.tsx
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useTranslation } from "react-i18next";
import { api } from '@/services/api';
import { Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/user';

interface CommentInputProps {
  postId: string;
  parentCommentId?: string;
  onCommentCreated: () => void;
  placeholder?: string;
currentUser?: UserProfile;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  parentCommentId,
  onCommentCreated,
  placeholder,
  currentUser
}) => {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<string>('');
// Sửa phần handleSubmit trong CommentInput.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!content.trim() || isSubmitting) return;

  setIsSubmitting(true);
  try {
    // Sử dụng createReply nếu có parentCommentId, ngược lại dùng createComment
    if (parentCommentId) {
      console.log('Creating reply:', { postId, parentCommentId, content: content.trim() });
      await api.comments.createReply(postId, parentCommentId, {
        content: content.trim(),
        image
      });
    } else {
      console.log('Creating comment:', { postId, content: content.trim() });
      await api.comments.createComment(postId, {
        content: content.trim(),
        image
      });
    }

    setContent('');
    setImage('');
    onCommentCreated();
    toast({
      title: parentCommentId ? t('comment.replyPosted') : t('comment.commentPosted'),
      description: parentCommentId ? t('comment.replyPostedDesc') : t('comment.commentPostedDesc'),
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    toast({
      title: t('comment.error'),
      description: t('comment.errorDesc'),
      variant: 'destructive'
    });
  } finally {
    setIsSubmitting(false);
  }
};
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Giả sử bạn có hàm upload ảnh cho comment
      // const imageUrl = await commentApi.uploadCommentImage(file);
      // setImage(imageUrl);
      
      toast({
        title: t('comment.imageUploaded'),
        description: t('comment.imageReady'),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('comment.uploadError'),
        description: t('comment.uploadErrorDesc'),
        variant: 'destructive'
      });
    }
  };

  return (
  <div className="mt-4 pt-3 border-t border-border/30">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            {/* THÊM AvatarImage để hiển thị ảnh đại diện */}
            <AvatarImage 
              src={currentUser?.avatar} 
              alt={currentUser?.displayName || currentUser?.username}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-primary-foreground text-xs font-bold">
              {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-3 bg-secondary/30 rounded-full px-4 py-2.5 hover:bg-secondary/50 transition-colors duration-200 group/input">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder || t('postCard.addComment')}
                className="flex-1 bg-transparent border-0 text-foreground placeholder-muted-foreground focus:outline-none text-sm group-focus-within/input:placeholder-foreground/70 transition-colors"
                disabled={isSubmitting}
              />
              
              <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1">
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>

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
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {(content.trim() || image) && (
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setContent('');
                setImage('');
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() && !image || isSubmitting}
              className="rounded-full"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('postCard.post')
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};