import React from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/store/useAppStore';

interface UserCardProps {
  user: Profile;
  onFollowToggle: (targetUserId: string, targetUsername: string) => void;
  showFollowButton: boolean;
  isUpdating?: boolean; 
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user,
  onFollowToggle, 
  showFollowButton = true 
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    const userId = user._id || user.id;
    navigate(`/profile/${userId}`, { replace: true });
  };

  const getUserId = () => user._id || user.id;
  const getUserName = () => user.username || user.name || 'user';
  const getDisplayName = () => user.displayName || user.name || user.username || 'User';

  return (
    <div className="flex items-center justify-between p-4 md:p-4 sm:p-2 hover:bg-accent rounded-xl md:rounded-lg transition-colors min-h-0">
      <div 
        className="flex items-center space-x-3 md:space-x-3 sm:space-x-1.5 flex-1 min-w-0 cursor-pointer" 
        onClick={handleViewProfile}
      >
        {/* Avatar - rất nhỏ trên mobile */}
        <Avatar className="h-12 w-12 md:h-12 md:w-12 sm:h-7 sm:w-7 flex-shrink-0">
          <AvatarImage src={user.avatar} alt={getUserName()} />
          <AvatarFallback className="text-sm md:text-base sm:text-[10px] font-medium">
            {getUserName().charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Display Name - rất nhỏ trên mobile */}
          <div className="font-semibold text-base md:text-base sm:text-[11px] truncate leading-tight">
            {getDisplayName()}
          </div>
          
          {/* Username - rất nhỏ trên mobile */}
          <div className="text-sm md:text-sm sm:text-[10px] text-muted-foreground truncate opacity-60 leading-tight sm:mt-0.5">
            @{getUserName()}
          </div>
          
          {/* Bio - ẩn trên mobile để tiết kiệm không gian */}
          {user.bio && (
            <div className="text-sm mt-1 line-clamp-1 hidden md:block">
              {user.bio}
            </div>
          )}
        </div>
      </div>
      
      {showFollowButton && (
        <Button
          variant={user.isFollowing ? "outline" : "default"}
          size="sm"
          className="ml-1 md:ml-0 sm:text-[10px] sm:px-2 sm:py-0.5 sm:h-5 flex-shrink-0 rounded-full md:rounded-md font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onFollowToggle(getUserId(), getUserName());
          }}
        >
          {/* Text ngắn hơn trên mobile */}
          <span className="hidden md:inline">
            {user.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </span>
          <span className="md:hidden">
            {user.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </span>
        </Button>
      )}
    </div>
  );
};
