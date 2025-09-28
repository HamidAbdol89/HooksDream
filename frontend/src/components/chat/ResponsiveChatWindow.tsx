// components/chat/ResponsiveChatWindow.tsx - Responsive chat window that switches between desktop and mobile
import React from 'react';
import { ChatWindow } from './desktop/ChatWindow';
import { MobileChatWindow } from './mobile/MobileChatWindow';
import { Message } from '@/types/chat';

interface ResponsiveChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  replyingTo?: Message | null;
  onReply?: (message: Message) => void;
  onCancelReply?: () => void;
}

export const ResponsiveChatWindow: React.FC<ResponsiveChatWindowProps> = ({ 
  conversationId,
  onBack,
  replyingTo,
  onReply,
  onCancelReply
}) => {
  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:flex flex-1 overflow-y-auto scrollbar-custom">
        <ChatWindow 
          conversationId={conversationId}
          replyingTo={replyingTo}
          onReply={onReply}
          onCancelReply={onCancelReply}
        />
      </div>
      
      {/* Mobile version */}
      <div className="md:hidden flex-1">
        <MobileChatWindow 
          conversationId={conversationId} 
          onBack={onBack}
          replyingTo={replyingTo}
          onReply={onReply}
          onCancelReply={onCancelReply}
        />
      </div>
    </>
  );
};
