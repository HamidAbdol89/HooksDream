// components/chat/shared/ConversationItem.tsx - Individual conversation item with new message highlighting
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Conversation } from '@/types/chat';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isSelected?: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  isSelected = false,
  onClick,
  isMobile = false
}) => {
  const { isUserOnline, getUserStatus } = useOnlineUsers();
  
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  const userStatus = otherParticipant?._id ? getUserStatus(otherParticipant._id) : { isOnline: false, lastSeenText: '' };
  
  // Chỉ hiển thị badge khi thực sự có unread messages
  const unreadCount = conversation.unreadCount;
  const shouldShowBadge = Boolean(unreadCount && unreadCount > 0);
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/30 ${
        isMobile 
          ? 'hover:bg-muted/50 active:bg-muted' 
          : `hover:bg-muted/50 mx-2 rounded-lg ${
              isSelected 
                ? 'bg-primary/10 border border-primary/20' 
                : ''
            }`
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14 md:w-12 md:h-12'}`}>
          <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.displayName} />
          <AvatarFallback>
            {otherParticipant?.displayName?.charAt(0) || otherParticipant?.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator */}
        {otherParticipant?._id && isUserOnline(otherParticipant._id) && (
          <div className={`absolute -bottom-0.5 -right-0.5 bg-green-500 border-2 border-background rounded-full ${
            isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-3 md:h-3'
          }`} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${
              isMobile ? 'text-base' : 'text-base md:text-sm'
            } text-foreground`}>
              {otherParticipant?.displayName || otherParticipant?.username}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {conversation.lastMessage?.content?.text || 'Tap to start chatting'}
              </p>
              {shouldShowBadge && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full min-w-[18px] text-center font-medium ml-2">
                  {(unreadCount || 0) > 99 ? '99+' : (unreadCount || 0)}
                </span>
              )}
            </div>
            {/* Last seen status */}
            {otherParticipant?._id && (
              <p className={`text-xs mt-1 ${
                userStatus.isOnline ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {userStatus.lastSeenText}
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
};
