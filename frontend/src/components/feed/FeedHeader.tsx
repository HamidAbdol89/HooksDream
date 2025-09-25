// src/components/feed/FeedHeader.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useTranslation } from 'react-i18next';

interface FeedHeaderProps {
  currentUserProfile?: any;
  profile?: any;
  onCreatePost: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  currentUserProfile,
  profile,
  onCreatePost
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
      <div className="p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-border">
            <AvatarImage 
              src={currentUserProfile?.avatar || profile?.avatar} 
              alt={currentUserProfile?.displayName || profile?.displayName || "User"} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px] sm:text-sm">
              {(currentUserProfile?.displayName || profile?.displayName)?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={onCreatePost}
            className="flex-1 text-left px-2.5 py-2 sm:px-4 sm:py-3 bg-secondary hover:bg-secondary/80 transition-all duration-300 rounded-2xl text-secondary-foreground text-sm sm:text-base"
          >
            {t('feed.createPost.placeholder') || 'Bạn đang nghĩ gì?'}
          </button>
          <button
            onClick={onCreatePost}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 rounded-xl flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};