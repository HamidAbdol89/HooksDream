// components/chat/mobile/MobileHeader.tsx - Mobile chat header
import React from 'react';
import { ArrowLeft, Search, Edit3, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  showEdit?: boolean;
  showMore?: boolean;
  subtitle?: string;
  avatar?: string;
  userId?: string; // For online status check
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showSearch = false,
  showEdit = false,
  showMore = false,
  subtitle,
  avatar,
  userId
}) => {
  const { isUserOnline, getUserStatus } = useOnlineUsers();
  
  // Get user status if userId is provided
  const userStatus = userId ? getUserStatus(userId) : { isOnline: false, lastSeenText: '' };
  
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border/50 sticky top-0 z-50 backdrop-blur-md bg-background/95">
      {/* Left side */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-muted/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img 
                src={avatar} 
                alt={title}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.jpg';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  {title?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            {/* Online indicator */}
            {userId && isUserOnline(userId) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground text-lg truncate">
              {title}
            </h1>
            {(subtitle || userStatus.lastSeenText) && (
              <p className={`text-sm truncate ${
                userStatus.isOnline ? 'text-green-500 font-medium' : 'text-muted-foreground'
              }`}>
                {userStatus.lastSeenText || subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
