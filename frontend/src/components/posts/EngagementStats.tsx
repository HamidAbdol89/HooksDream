// src/components/posts/EngagementStats.tsx
import React, { useMemo, useCallback } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from "react-i18next";
import { Post } from '@/types/post';
import { AnimatePresence, motion } from 'framer-motion'; // Thêm framer-motion để animation mượt mà, tối ưu dopamine

interface EngagementStatsProps {
  post: Post;
  showComments: boolean;
  onToggleComments: () => void;
  onShowLikes?: () => void;
  currentUserId?: string;
  commentCount?: number;
}

export const EngagementStats: React.FC<EngagementStatsProps> = React.memo(({
  post,
  showComments,
  onToggleComments,
  onShowLikes,
  commentCount
}) => {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();

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
      {/* Like Section với animation để khai thác dopamine */}
      {post.likeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center space-x-2 mb-2"
        >
          <AnimatePresence>
            <motion.div 
              className="flex -space-x-1"
              whileHover={{ scale: 1.05 }} // Hiệu ứng hover để khuyến khích click
            >
              {Array.from({ length: Math.min(3, post.likeCount) }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.2, rotate: 5 }} // Animation vui mắt, dopamine boost
                  className="w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center cursor-pointer transition-transform"
                >
                  <Heart className="w-2.5 h-2.5 text-white fill-current" />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          <button 
            onClick={onShowLikes}
            className="text-sm text-gray-900 dark:text-gray-100 hover:text-red-500 active:text-red-600 transition-colors font-medium"
          >
            {post.likeCount === 1 ? `1 ${t('postCard.like')}` : `${formatCount(post.likeCount)} ${t('postCard.likes')}`}
          </button>
        </motion.div>
      )}
      
      {/* Comment Section - Hiển thị trên cả mobile và desktop, nhưng responsive */}
      {displayedCommentCount > 0 && (
        <motion.button 
          onClick={onToggleComments}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }} // Hiệu ứng hover cho dopamine
          whileTap={{ scale: 0.95 }} // Hiệu ứng tap cho cảm giác responsive trên mobile
          className={`text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${
            isMobile ? 'w-full text-left' : ''
          }`}
        >
          {showComments ? t('postCard.hide') : t('postCard.viewAll')} {formatCount(displayedCommentCount)} {t('postCard.comments')}
        </motion.button>
      )}
    </div>
  );
});