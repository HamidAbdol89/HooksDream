// components/chat/ConversationsList.tsx
import React from 'react';
import { MessageSquare, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  }>;
  lastMessage?: {
    content: {
      text?: string;
    };
  };
  lastActivity: string;
  unreadCount?: number;
}

interface ConversationsListProps {
  conversations: Conversation[];
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
  error?: any;
  onSwitchToFollowing: () => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  isLoading = false,
  error = null,
  onSwitchToFollowing
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

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load conversations
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a conversation from the Following tab
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSwitchToFollowing}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          View Following
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
        const isSelected = selectedConversationId === conversation._id;
        
        return (
          <div
            key={conversation._id}
            onClick={() => onSelectConversation(conversation._id)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-primary/10 border border-primary/20' 
                : 'hover:bg-muted/50'
            }`}
          >
            {/* Avatar */}
            <Avatar className="w-12 h-12">
              <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.displayName} />
              <AvatarFallback>
                {otherParticipant?.displayName?.charAt(0) || otherParticipant?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground truncate">
                  {otherParticipant?.displayName || otherParticipant?.username}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {conversation.lastMessage ? 
                    new Date(conversation.lastActivity).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage?.content?.text || 'No messages yet'}
                </p>
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
