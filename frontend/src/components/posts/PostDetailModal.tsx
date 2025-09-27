import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PostCard } from './PostCard';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFollow?: () => void;
  isFollowLoading?: boolean;
  currentUserHashId?: string;
  currentUser?: any;
  onPostUpdate?: (updatedPost: any) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  isOpen,
  onClose,
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onFollow,
  isFollowLoading = false,
  currentUserHashId,
  currentUser,
  onPostUpdate
}) => {
  if (!post) return null;

  const handleLike = () => {
    if (onLike) {
      onLike();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Chi tiết bài viết
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Post Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <PostCard
              post={post}
              onLike={handleLike}
              onComment={onComment}
              onShare={onShare}
              onBookmark={onBookmark}
              onFollow={onFollow}
              isFollowLoading={isFollowLoading}
              currentUserHashId={currentUserHashId}
              currentUser={currentUser}
              onPostUpdate={onPostUpdate}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailModal;
