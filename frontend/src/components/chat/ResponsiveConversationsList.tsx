// components/chat/ResponsiveConversationsList.tsx - Responsive conversations list
import React from 'react';
import { ConversationsList as DesktopConversationsList } from './desktop/ConversationsList';
import { MobileConversationsList } from './mobile/MobileConversationsList';

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

interface ResponsiveConversationsListProps {
  conversations: Conversation[];
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, user?: any) => void;
  isLoading?: boolean;
  error?: any;
  onSwitchToFollowing: () => void;
}

export const ResponsiveConversationsList: React.FC<ResponsiveConversationsListProps> = (props) => {
  return (
    <>
      {/* Desktop version */}
      <DesktopConversationsList {...props} />
      
      {/* Mobile version - sử dụng same data như desktop */}
      <div className="md:hidden">
        <MobileConversationsList 
          conversations={props.conversations}
          currentUserId={props.currentUserId}
          onSelectConversation={props.onSelectConversation}
          isLoading={props.isLoading}
        />
      </div>
    </>
  );
};
