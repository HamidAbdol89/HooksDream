// components/ui/FollowButton.tsx - Reusable Follow Button với Socket.IO
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UnfollowConfirmDialog } from '@/components/dialogs/UnfollowConfirmDialog';

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
  username?: string; // ✅ THÊM username prop
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
  disabled = false,
  username = 'user'
}) => {
  const { t } = useTranslation('common');
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
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
    
    if (isFollowing) {
      // Hiển thị dialog xác nhận unfollow
      setShowUnfollowDialog(true);
    } else {
      // Follow trực tiếp
      handleToggleFollow();
    }
  };

  const handleConfirmUnfollow = () => {
    setShowUnfollowDialog(false);
    handleToggleFollow();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant={isFollowing ? 'secondary' : 'default'}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          rounded-full transition-all duration-300 border-0
          ${isFollowing 
            ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' 
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
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
              <UserCheck className="w-4 h-4" />
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
          {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
          {showCount && followerCount > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({followerCount})
            </span>
          )}
        </motion.span>
      </Button>

      {/* Unfollow Confirmation Dialog */}
      <UnfollowConfirmDialog
        isOpen={showUnfollowDialog}
        onClose={() => setShowUnfollowDialog(false)}
        onConfirm={handleConfirmUnfollow}
        username={username}
        isLoading={isLoading}
      />
    </motion.div>
  );
};

// Hook để sử dụng trong các component khác
export const useFollowButton = (userId: string) => {
  return useFollow({ userId });
};
