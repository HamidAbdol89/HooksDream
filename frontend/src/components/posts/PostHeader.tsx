// src/components/posts/PostHeader.tsx (updated với Socket.IO)
import React, { memo, useMemo, useCallback, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from '@/components/ui/Button';
import { formatTimeAgo } from '@/utils/formatters';
import { useTranslation } from "react-i18next";
import { User } from '@/types/post';
import { FollowButton } from '@/components/ui/FollowButton';
import { MoreHorizontal, Trash2, Edit, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface PostHeaderProps {
  user: User;
  createdAt: string;
  onFollow?: () => void;
  isFollowLoading?: boolean;
  onUserClick: () => void;
  isOwnProfile?: boolean;
  currentUserId?: string;
  postId?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

export const PostHeader: React.FC<PostHeaderProps> = memo(({
  user,
  createdAt,
  onFollow,
  isFollowLoading = false,
  onUserClick,
  isOwnProfile = false,
  currentUserId,
  postId,
  onDelete,
  onEdit,
  onReport
}) => {
  const { t } = useTranslation("common");
  
  // Memoize expensive calculations
  const { shouldShowFollowButton, userInitial, formattedTime, isAuthor, shouldShowMenu } = useMemo(() => {
    const showFollowBtn = onFollow && !isOwnProfile;
    const initial = user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?';
    const timeFormatted = formatTimeAgo(createdAt);
    const isPostAuthor = currentUserId === user._id;
    const showMenu = isPostAuthor || onReport; // Show menu if author or can report
    
    return {
      shouldShowFollowButton: showFollowBtn,
      userInitial: initial,
      formattedTime: timeFormatted,
      isAuthor: isPostAuthor,
      shouldShowMenu: showMenu
    };
  }, [onFollow, isOwnProfile, user.displayName, user.username, createdAt, currentUserId, user._id, onReport]);
  
  // Memoize click handler
  const handleUserClick = useCallback(() => {
    onUserClick();
  }, [onUserClick]);

  return (
    <header className="flex items-center justify-between p-3 sm:p-4">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
        <button 
          onClick={handleUserClick}
          className="flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-background">
            <AvatarImage 
              src={user.avatar} 
              alt={user.displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <button 
            onClick={handleUserClick}
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
            {formattedTime}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
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

        {/* Post Actions Menu */}
        {shouldShowMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor && (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('post.edit', 'Edit post')}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('post.delete', 'Delete post')}
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {!isAuthor && onReport && (
                <>
                  {isAuthor && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={onReport}>
                    <Flag className="mr-2 h-4 w-4" />
                    {t('post.report', 'Report post')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
});

PostHeader.displayName = 'PostHeader';
