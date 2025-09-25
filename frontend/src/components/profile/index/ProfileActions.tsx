import React from 'react';
import { Edit3, UserPlus, MoreHorizontal, MessageCircle, Share2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile: () => void;
  onFollow: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwnProfile,
  isFollowing,
  onEditProfile,
  onFollow
}) => {
  // Show edit profile button only for own profile
  if (isOwnProfile) {
    return (
      <div className="flex justify-center space-x-3 px-4 mb-4">
        <Button 
          onClick={onEditProfile}
          variant="outline"
          className="flex-1 max-w-[200px] flex items-center justify-center space-x-2 rounded-full py-2 text-sm font-medium"
        >
          <Edit3 className="h-4 w-4" />
          <span>Chỉnh sửa</span>
        </Button>
      </div>
    );
  }

  // Show follow/unfollow buttons for other users
  return (
    <div className="flex justify-center items-center space-x-2 px-2 mb-4">
      <Button 
        onClick={onFollow}
        variant={isFollowing ? "outline" : "default"}
        className="flex items-center justify-center space-x-1 rounded-full py-1 px-3 text-xs font-medium md:py-2 md:px-4 md:text-sm"
      >
        {isFollowing ? <UserCheck className="h-3 w-3 md:h-4 md:w-4" /> : <UserPlus className="h-3 w-3 md:h-4 md:w-4" />}
        <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0"
          >
            <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 md:w-48">
          <DropdownMenuItem>
            <MessageCircle className="mr-2 h-4 w-4" />
            Nhắn tin
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="mr-2 h-4 w-4" />
            Chia sẻ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};