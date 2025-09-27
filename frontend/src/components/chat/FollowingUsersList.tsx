// components/chat/FollowingUsersList.tsx
import React from 'react';
import { MessageSquare, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface FollowingUsersListProps {
  users: User[];
  onStartChat: (userId: string) => void;
  isLoading?: boolean;
}

export const FollowingUsersList: React.FC<FollowingUsersListProps> = ({
  users,
  onStartChat,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
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
      <div className="p-8 text-center">
        <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
    <div className="p-2">
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => onStartChat(user._id)}
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
        >
          {/* Avatar */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {user.displayName || user.username}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              @{user.username}
            </p>
          </div>
          
          {/* Chat button */}
          <Button size="sm" variant="ghost" className="px-3">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
