// components/chat/ChatHeader.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

interface ChatHeaderProps {
  user?: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  user, 
  isOnline = true 
}) => {
  return (
    <div className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-primary/10">
              <AvatarImage src={user?.avatar || "/default-avatar.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {user?.displayName || user?.username || 'Chat Partner'}
            </h3>
            <p className={`text-sm font-medium ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
