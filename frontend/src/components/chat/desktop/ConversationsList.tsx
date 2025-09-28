// components/chat/desktop/ConversationsList.tsx - Desktop conversations list
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, UserCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

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
  onSelectConversation: (conversationId: string, user?: any) => void;
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
  error,
  onSwitchToFollowing
}) => {
  const { t } = useTranslation('common');
  const { isUserOnline, getUserStatus } = useOnlineUsers();
  
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
        {t('feed.error.loading')}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-2">{t('chat.noConversations.title')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('chat.noConversations.description')}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSwitchToFollowing}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          {t('chat.following')}
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
        const isSelected = selectedConversationId === conversation._id;
        
        
        return (
          <div
            key={conversation._id}
            onClick={() => onSelectConversation(conversation._id, otherParticipant)}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/30 mx-2 rounded-lg ${
              isSelected 
                ? 'bg-primary/10 border border-primary/20' 
                : 'hover:bg-muted/50'
            }`}
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.displayName} />
                <AvatarFallback>
                  {otherParticipant?.displayName?.charAt(0) || otherParticipant?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              {otherParticipant?._id && isUserOnline(otherParticipant._id) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-sm">
                    {otherParticipant?.displayName || otherParticipant?.username}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conversation.lastMessage?.content?.text || t('chat.tapToStartChatting')}
                    </p>
                    {Boolean(conversation.unreadCount && conversation.unreadCount > 0) && (
                      <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium ml-2">
                        {(conversation.unreadCount || 0) > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  {/* Last seen status */}
                  {otherParticipant?._id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getUserStatus(otherParticipant._id).lastSeenText}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <span className="text-xs text-muted-foreground">
                    {conversation.lastMessage ? 
                      new Date(conversation.lastActivity).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
