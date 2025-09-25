// components/ui/FollowButton.tsx - Reusable Follow Button với Socket.IO
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
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
    <div>
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
          <div className="mr-2">
            {isFollowing ? (
              <UserCheck className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </div>
        ) : null}
        
        <span>
          {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
          {showCount && followerCount > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({followerCount})
            </span>
          )}
        </span>
      </Button>

      {/* Unfollow Confirmation Dialog */}
      <UnfollowConfirmDialog
        isOpen={showUnfollowDialog}
        onClose={() => setShowUnfollowDialog(false)}
        onConfirm={handleConfirmUnfollow}
        username={username}
        isLoading={isLoading}
      />
    </div>
  );
};

// Hook để sử dụng trong các component khác
export const useFollowButton = (userId: string) => {
  return useFollow({ userId });
};
