// src/components/posts/PostHeader.tsx (updated)
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/utils/formatters';
import { useTranslation } from "react-i18next";
import { User } from '@/types/post';
import { useUnfollowConfirm } from '@/contexts/UnfollowConfirmContext'; // Thêm import

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
  const { showUnfollowConfirm } = useUnfollowConfirm(); // Sử dụng hook context
  
  // Ẩn nút follow nếu là chính mình
  const shouldShowFollowButton = onFollow && !isOwnProfile;

  // Xử lý click follow/unfollow
  const handleFollowClick = () => {
    if (user.isFollowing && onFollow) {
      // Hiển thị dialog xác nhận nếu đang unfollow
      showUnfollowConfirm(user.username, onFollow);
    } else if (onFollow) {
      // Follow bình thường
      onFollow();
    }
  };

  return (
    <header className="flex items-start justify-between p-3 sm:p-4 pb-2 sm:pb-3">
      <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
        {/* Avatar */}
        <div 
          className="relative flex-shrink-0 group/avatar"
          onClick={onUserClick}
          style={{ cursor: 'pointer' }}
        >
          <Avatar className="w-9 h-9 sm:w-11 sm:h-11 ring-2 ring-transparent group-hover/avatar:ring-primary/20 transition-all duration-300 cursor-pointer">
            <AvatarImage 
              src={user.avatar} 
              alt={user.displayName}
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-xs sm:text-sm">
              {user.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* User info */}
        <div 
          className="flex-1 min-w-0 pt-0.5"
          onClick={onUserClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center space-x-1 sm:space-x-1.5 mb-0.5">
            <h3 className="font-bold text-foreground text-xs sm:text-sm truncate cursor-pointer">
              {user.displayName}
            </h3>
            
            {user.isVerified && (
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <span className="truncate cursor-pointer">
              @{user.username}
            </span>
            <span className="text-[11px] sm:text-xs">•</span>
            <time className="whitespace-nowrap cursor-pointer">
              {formatTimeAgo(createdAt)}
            </time>
          </div>
        </div>
      </div>
      
        {/* Follow/Unfollow button - chỉ hiển thị nếu không phải chính mình */}
      {shouldShowFollowButton && (
        <button
          onClick={handleFollowClick} // Sử dụng hàm xử lý mới
          disabled={isFollowLoading}
          className={cn(
            "px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200",
            user.isFollowing 
              ? "bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              : "bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98]",
            isFollowLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isFollowLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : user.isFollowing ? (
            t('postCard.following')
          ) : (
            t('postCard.follow')
          )}
        </button>
      )}
    </header>
  );
};