// components/ui/FollowButton.tsx - Reusable Follow Button với Socket.IO
import React from 'react';
import { Button } from '@/components/ui/Button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showCount?: boolean;
  className?: string;
  disabled?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  variant = 'default',
  size = 'default',
  showIcon = true,
  showCount = false,
  className = '',
  disabled = false
}) => {
  const { t } = useTranslation('common');
  const {
    isFollowing,
    followerCount,
    isLoading,
    handleToggleFollow
  } = useFollow({
    userId,
    initialIsFollowing,
    initialFollowerCount
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleFollow();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant={isFollowing ? 'outline' : variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          transition-all duration-300 
          ${isFollowing 
            ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${className}
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : showIcon ? (
          <motion.div
            key={isFollowing ? 'following' : 'not-following'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mr-2"
          >
            {isFollowing ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </motion.div>
        ) : null}
        
        <motion.span
          key={`${isFollowing}-${followerCount}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isFollowing ? t('user.unfollow') : t('user.follow')}
          {showCount && followerCount > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({followerCount})
            </span>
          )}
        </motion.span>
      </Button>
    </motion.div>
  );
};

// Hook để sử dụng trong các component khác
export const useFollowButton = (userId: string) => {
  return useFollow({ userId });
};
