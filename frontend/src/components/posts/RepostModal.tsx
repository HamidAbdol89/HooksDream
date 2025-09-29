import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Repeat2, X } from 'lucide-react';
import { Post, Profile } from '@/store/useAppStore';
import { api } from '@/services/api';

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  currentUser: Profile;
  onRepostSuccess?: (repost: Post) => void;
}

export const RepostModal: React.FC<RepostModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUser,
  onRepostSuccess
}) => {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRepost = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const response = await api.post.repostPost(post._id, comment.trim());
      
      if (response.success) {
        onRepostSuccess?.(response.data);
        onClose();
        setComment('');
      }
    } catch (error) {
      console.error('Repost failed:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Repeat2 className="h-5 w-5" />
              Repost
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Current user info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
              <AvatarFallback>
                {currentUser.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Thêm bình luận của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none border-none p-0 text-base focus-visible:ring-0"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Original post preview */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.userId.avatar} alt={post.userId.username} />
                <AvatarFallback>
                  {post.userId.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{post.userId.displayName}</span>
                  <span className="text-muted-foreground text-sm">@{post.userId.username}</span>
                </div>
                {post.content && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {post.content}
                  </p>
                )}
                {post.images && post.images.length > 0 && (
                  <div className="mt-2">
                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden max-w-xs">
                      {post.images.slice(0, 4).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt=""
                          className="w-full h-20 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRepost}
              disabled={isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang repost...
                </div>
              ) : (
                'Repost'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
