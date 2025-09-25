import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useTranslation } from 'react-i18next';
import { CommentSection } from './CommentSection';
import { Profile } from '@/store/useAppStore';
import { Post } from '@/types/post';
import { CommentInput } from './CommentInput';

interface CommentSheetProps {
  post: Post;
  currentUser?: Profile;
  commentCount?: number;
  trigger?: React.ReactNode;
}

export const CommentSheet: React.FC<CommentSheetProps> = ({
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

  const defaultTrigger = (
    <button className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors">
      <MessageCircle className="w-5 h-5" />
      {displayedCommentCount > 0 && (
        <span className="text-sm font-medium">
          {formatCount(displayedCommentCount)}
        </span>
      )}
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[70vh] max-h-[70vh] rounded-t-xl border-t border-border/20 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-2 text-lg font-semibold">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span>
                {t('comment.title')} 
                {displayedCommentCount > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    ({formatCount(displayedCommentCount)})
                  </span>
                )}
              </span>
            </SheetTitle>
            
            <SheetClose asChild>
              <button 
                className="p-2 hover:bg-accent rounded-full transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4">
            <CommentSection 
              postId={post._id} 
              currentUser={currentUser}
              showInput={false}
            />
          </div>

          {/* Comment Input - Sticky at bottom */}
          <div className="border-t border-border/20 bg-background/95 backdrop-blur-sm p-4">
            <CommentInput 
              postId={post._id}
              currentUser={currentUser}
              onCommentCreated={() => {
                // Refresh comments or handle new comment
              }}
              placeholder={t('comment.placeholder')}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentSheet;
