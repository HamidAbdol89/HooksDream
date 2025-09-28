// components/chat/mobile/MobileHeader.tsx - Compact Mobile chat header
import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
<div className="md:hidden flex items-center justify-between px-3 py-2 bg-background border-b border-border/50 sticky top-0 z-50 backdrop-blur-md bg-background/95 rounded-b-xl">
{/* Left side */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={title}
                className="w-7 h-7 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.jpg';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  {title?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            {/* Online indicator */}
            {userId && isUserOnline(userId) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground text-base truncate">
              {title}
            </h1>
            {(subtitle || userStatus.lastSeenText) && (
              <p
                className={`text-xs truncate ${
                  userStatus.isOnline
                    ? 'text-green-500 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {userStatus.lastSeenText || subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
