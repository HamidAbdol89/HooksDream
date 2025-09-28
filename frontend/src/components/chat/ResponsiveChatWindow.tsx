// components/chat/ResponsiveChatWindow.tsx - Responsive chat window that switches between desktop and mobile
import React from 'react';
import { ChatWindow } from './desktop/ChatWindow';
import { MobileChatWindow } from './mobile/MobileChatWindow';

interface ResponsiveChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export const ResponsiveChatWindow: React.FC<ResponsiveChatWindowProps> = ({ 
  conversationId,
  onBack 
}) => {
  return (
    <>
      {/* Desktop version */}
  <div className="flex-1 overflow-y-auto scrollbar-custom">
  <ChatWindow conversationId={conversationId} />
</div>

      
      {/* Mobile version */}
      <div className="md:hidden flex-1">
        <MobileChatWindow 
          conversationId={conversationId} 
          onBack={onBack}
        />
      </div>
    </>
  );
};
