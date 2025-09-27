import React, { useState, useCallback, useMemo } from 'react';
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
  
  // Memoize expensive calculations
  const memoizedFormatCount = useCallback((count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);
  
  const displayedCommentCount = useMemo(() => 
    commentCount !== undefined ? commentCount : post.commentCount,
    [commentCount, post.commentCount]
  );
  

  const defaultTrigger = (
    <button className="flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-foreground transition-colors">
      <MessageCircle className="w-5 h-5" />
      {displayedCommentCount > 0 && (
        <span className="text-sm font-medium">
          {memoizedFormatCount(displayedCommentCount)}
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
        className="h-[90vh] sm:h-[70vh] max-h-[90vh] sm:max-h-[70vh] rounded-t-3xl sm:rounded-t-xl border-t border-border/20 p-0 overflow-hidden will-change-transform transform-gpu"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        {/* Header */}
        {/* Mobile-optimized Header */}
        <SheetHeader className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          {/* Mobile: Drag handle */}
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-2 sm:hidden" />
          
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-1.5 sm:space-x-2 text-base sm:text-lg font-semibold">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base">
                {t('comment.title')} 
                {displayedCommentCount > 0 && (
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-muted-foreground font-normal">
                    ({memoizedFormatCount(displayedCommentCount)})
                  </span>
                )}
              </span>
            </SheetTitle>
            
            <SheetClose asChild>
              <button 
                className="p-1.5 sm:p-2 hover:bg-accent rounded-full transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Comments List - Mobile optimized */}
          <div 
            className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 overscroll-behavior-y-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              willChange: 'scroll-position'
            }}
          >
            <CommentSection 
              postId={post._id} 
              currentUser={currentUser}
              showInput={false}
            />
          </div>

          {/* Comment Input - Sticky at bottom, mobile optimized */}
          <div className="border-t border-border/20 bg-background/95 backdrop-blur-sm p-2 sm:p-4">
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
