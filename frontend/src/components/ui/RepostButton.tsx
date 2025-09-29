import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepost } from '@/hooks/useRepost';
import { RepostModal } from '@/components/posts/RepostModal';
import { useAppStore, convertUserToProfile } from '@/store/useAppStore';
import { Post } from '@/store/useAppStore';

interface RepostButtonProps {
  post: Post;
  onRepostSuccess?: (repost: Post) => void;
  className?: string;
  showCount?: boolean;
  variant?: 'default' | 'minimal';
}

export const RepostButton: React.FC<RepostButtonProps> = ({
  post,
  onRepostSuccess,
  className,
  showCount = true,
  variant = 'default'
}) => {
  const [showRepostModal, setShowRepostModal] = useState(false);
  const { user } = useAppStore();
  const { repostPost, isReposting, error, clearError } = useRepost();

  // Don't show repost button for own posts
  const isOwnPost = user && post.userId._id === user._id;
  
  if (isOwnPost) {
    return null;
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleRepost = () => {
    if (!user) return;
    
    clearError();
    setShowRepostModal(true);
  };

  const handleRepostSuccess = (repost: Post) => {
    setShowRepostModal(false);
    onRepostSuccess?.(repost);
  };

  const handleCloseModal = () => {
    if (!isReposting) {
      setShowRepostModal(false);
      clearError();
    }
  };

  const repostCount = post.repostCount || 0;

  return (
    <>
      <button
        onClick={handleRepost}
        className={cn(
          "flex items-center space-x-1.5 sm:space-x-2 text-muted-foreground hover:text-green-500 transition-colors",
          variant === 'minimal' && "p-1",
          className
        )}
        aria-label="Repost"
        disabled={!user}
      >
        <Repeat2 className="w-5 h-5" />
        {showCount && repostCount > 0 && (
          <span className="font-medium text-sm tabular-nums">
            {formatCount(repostCount)}
          </span>
        )}
      </button>

      {/* Repost Modal */}
      {user && (
        <RepostModal
          isOpen={showRepostModal}
          onClose={handleCloseModal}
          post={post}
          currentUser={convertUserToProfile(user)}
          onRepostSuccess={handleRepostSuccess}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-red-600 text-xs whitespace-nowrap">{error}</p>
        </div>
      )}
    </>
  );
};
