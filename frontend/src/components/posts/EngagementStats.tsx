// src/components/posts/EngagementStats.tsx - Clean version with PostLikesSheet
import React, { useMemo, useCallback, useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from "react-i18next";
import { Post } from '@/types/post';
import { PostLikesSheet } from './PostLikesSheet';

interface EngagementStatsProps {
  post: Post;
  showComments: boolean;
  onToggleComments: () => void;
  currentUserId?: string;
  commentCount?: number;
}

export const EngagementStats: React.FC<EngagementStatsProps> = React.memo(({
  post,
  showComments,
  onToggleComments,
  currentUserId,
  commentCount
}) => {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
  const [showLikesSheet, setShowLikesSheet] = useState(false);

  // Sử dụng commentCount nếu có, ngược lại dùng post.commentCount
  const displayedCommentCount = useMemo(() => commentCount ?? post.commentCount ?? 0, [commentCount, post.commentCount]);

  // Memoize formatCount để tránh tính toán không cần thiết
  const formatCount = useCallback((count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  // Nếu không có engagement, return null để tối ưu render
  if (post.likeCount <= 0 && displayedCommentCount <= 0) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800">
      {/* Like Section */}
      {post.likeCount > 0 && (
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(3, post.likeCount) }).map((_, i) => (
              <div 
                key={i}
                className="w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              >
                <Heart className="w-2.5 h-2.5 text-white fill-current" />
              </div>
            ))}
          </div>
          
          <PostLikesSheet
            postId={post._id}
            open={showLikesSheet}
            onOpenChange={setShowLikesSheet}
            currentUserId={currentUserId}
            trigger={
              <button className="text-sm text-gray-900 dark:text-gray-100 hover:text-red-500 active:text-red-600 transition-colors font-medium">
                {post.likeCount === 1 ? `1 ${t('postCard.like')}` : `${formatCount(post.likeCount)} ${t('postCard.likes')}`}
              </button>
            }
          />
        </div>
      )}
      
      {/* Comment Section */}
      {displayedCommentCount > 0 && (
        <button 
          onClick={onToggleComments}
          className={`text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${
            isMobile ? 'w-full text-left' : ''
          }`}
        >
          {showComments ? t('postCard.hide') : t('postCard.viewAll')} {formatCount(displayedCommentCount)} {t('postCard.comments')}
        </button>
      )}
    </div>
  );
});

EngagementStats.displayName = 'EngagementStats';
