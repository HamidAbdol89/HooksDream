import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { CommentSection } from './CommentSection';
import { Profile } from '@/store/useAppStore';
import { Post } from '@/types/post';
import { CommentInput } from './CommentInput';

interface CommentDialogProps {
  post: Post;
  currentUser?: Profile;
  commentCount?: number;
  trigger?: React.ReactNode;
}

export const CommentDialog: React.FC<CommentDialogProps> = ({
  post,
  currentUser,
  commentCount,
  trigger
}) => {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  
  const displayedCommentCount = commentCount !== undefined ? commentCount : post.commentCount;

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground touch-manipulation hover:text-foreground transition-colors">
            <MessageCircle className="w-5 h-5" />
            {displayedCommentCount > 0 && (
              <span className="font-medium text-sm tabular-nums">
                {formatCount(displayedCommentCount)}
              </span>
            )}
          </button>
        )}
      </DialogTrigger>
      
   <DialogContent
  className="
    comment-dialog 
    w-full h-full 
    sm:w-[90vw] sm:max-w-5xl sm:max-h-[85vh] 
    lg:w-[80vw] lg:max-w-6xl lg:max-h-[90vh] 
    xl:w-[75vw] xl:max-w-7xl
    p-0 gap-0 sm:rounded-xl 
    flex flex-col bg-background text-foreground
  "
>
<DialogHeader className="flex items-center justify-between px-4 py-3 border-b border-border bg-background rounded-t-xl sm:rounded-t-none">
  <DialogTitle className="text-base sm:text-xl font-semibold text-foreground">
    {t('comment.comments')}
  </DialogTitle>
</DialogHeader>





        {/* Content - Comments List */}
        <div className="comment-dialog-content flex-1 overflow-y-auto">
          <CommentSection
            postId={post._id}
            currentUser={currentUser}
            showInput={false}
          />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-border/30 bg-background p-4 shrink-0">
          <CommentInput
            postId={post._id}
            onCommentCreated={() => {
              // Trigger refresh of comments
              window.dispatchEvent(new CustomEvent('commentCreated', { detail: { postId: post._id } }));
            }}
            placeholder={t('comment.addComment')}
            currentUser={currentUser}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};