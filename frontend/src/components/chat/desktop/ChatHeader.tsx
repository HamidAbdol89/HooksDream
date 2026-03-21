// components/chat/desktop/ChatHeader.tsx - Desktop chat header
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

interface User {
  _id?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

interface ChatHeaderProps {
  user?: User;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  user,
  onBack
}) => {
  const { t } = useTranslation('common');
  const { isUserOnline, getUserStatus } = useOnlineUsers();
  
  const userStatus = user?._id ? getUserStatus(user._id) : { isOnline: false, lastSeenText: '' };
  return (
    <div className="px-4 sm:px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onBack}
              aria-label={t('chat.backToList')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-primary/10">
              <AvatarImage src={user?.avatar || "/default-avatar.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {userStatus.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {user?.displayName || user?.username || t('user')}
            </h3>
            <p className={`text-sm font-medium ${userStatus.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
              {userStatus.lastSeenText || t('chat.onlineStatus.offline')}
            </p>
          </div>
        </div>
       
      </div>
    </div>
  );
};
