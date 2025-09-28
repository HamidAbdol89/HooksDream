import React from 'react';
import { Edit3, MoreHorizontal, MessageCircle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FollowButton } from '@/components/ui/FollowButton';
import { usePageTransition } from '@/components/ui/PageTransition';
import { useAppStore } from '@/store/useAppStore';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile: () => void;
  onFollow?: () => void;
  userId?: string;
  followerCount?: number;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwnProfile,
  isFollowing,
  onEditProfile,
  onFollow,
  userId,
  followerCount
}) => {
  const navigate = useNavigate();
  const { startTransition } = usePageTransition();
  const { user } = useAppStore();

  const handleEditProfile = () => {
    startTransition(() => {
      // Navigate with user's hashId or username
      const userIdentifier = user?.hashId || user?.username || 'me';
      navigate(`/edit-profile/${userIdentifier}`);
    }, 100);
  };

  // Show edit profile button only for own profile
  if (isOwnProfile) {
    return (
      <div className="flex justify-center px-4 mb-4">
        <Button 
          onClick={handleEditProfile}
          variant="outline"
          size="default"
          className="flex items-center gap-2 px-8"
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
      {userId && (
        <FollowButton
          userId={userId}
          initialIsFollowing={isFollowing}
          initialFollowerCount={followerCount}
          username={userId} // TODO: Pass actual username
          size="sm"
          className="py-1 px-3 text-xs font-medium md:py-2 md:px-4 md:text-sm"
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
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