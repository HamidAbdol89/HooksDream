// components/chat/desktop/FollowingUsersList.tsx - Desktop following users list
import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface FollowingUsersListProps {
  users: User[];
  onStartChat: (userId: string, user?: User) => void;
  isLoading?: boolean;
}

export const FollowingUsersList: React.FC<FollowingUsersListProps> = ({
  users,
  onStartChat,
  isLoading = false
}) => {
  const { isUserOnline } = useOnlineUsers();
  
  if (isLoading) {
    return (
      <div className="hidden md:block p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="hidden md:block p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-2">No following users</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Follow some users to start chatting with them
        </p>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Find People
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => onStartChat(user._id, user)}
          className="flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/30 hover:bg-muted/50 mx-2 rounded-lg"
        >
          {/* Avatar with online indicator */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>
                {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            {isUserOnline(user._id) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {user.displayName || user.username}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              @{user.username} • Tap to message
            </p>
          </div>
          
          {/* Chat button - Desktop style */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
