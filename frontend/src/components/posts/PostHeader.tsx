// src/components/posts/PostHeader.tsx (updated với Socket.IO)
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { formatTimeAgo } from '@/utils/formatters';
import { useTranslation } from "react-i18next";
import { User } from '@/types/post';
import { FollowButton } from '@/components/ui/FollowButton';

interface PostHeaderProps {
  user: User;
  createdAt: string;
  onFollow?: () => void;
  isFollowLoading?: boolean;
  onUserClick: () => void;
  isOwnProfile?: boolean;
}

export const PostHeader: React.FC<PostHeaderProps> = ({
  user,
  createdAt,
  onFollow,
  isFollowLoading = false,
  onUserClick,
  isOwnProfile = false
}) => {
  const { t } = useTranslation("common");
  
  // Ẩn nút follow nếu là chính mình
  const shouldShowFollowButton = onFollow && !isOwnProfile;

  return (
    <header className="flex items-center justify-between p-3 sm:p-4">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
        <button 
          onClick={onUserClick}
          className="flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-background">
            <AvatarImage 
              src={user.avatar} 
              alt={user.displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-semibold">
              {user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <button 
            onClick={onUserClick}
            className="block text-left transition-colors duration-200 hover:text-primary"
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {user.displayName || user.username}
              </h3>
              {user.isVerified && (
                <svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              )}
            </div>
            
            {user.username !== user.displayName && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            )}
          </button>

          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTimeAgo(createdAt)}
          </p>
        </div>
      </div>
      
      {/* Follow/Unfollow button với Socket.IO - chỉ hiển thị nếu không phải chính mình */}
      {shouldShowFollowButton && user._id && (
        <FollowButton
          userId={user._id}
          initialIsFollowing={user.isFollowing}
          username={user.username}
          size="sm"
          className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm"
        />
      )}
    </header>
  );
};
