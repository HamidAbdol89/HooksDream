// components/chat/shared/MessageBubble.tsx - Shared message bubble for both desktop and mobile
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
}

// Message Status Text Component
const MessageStatusText: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <span className="text-muted-foreground text-xs">Đang gửi...</span>;
    case 'sent':
      return <span className="text-muted-foreground text-xs">Đã gửi</span>;
    case 'delivered':
      return <span className="text-muted-foreground text-xs">Đã nhận</span>;
    case 'read':
      return <span className="text-blue-500 text-xs">Đã xem</span>;
    case 'failed':
      return <span className="text-red-500 text-xs">Gửi lỗi</span>;
    default:
      return <span className="text-muted-foreground text-xs">Đã gửi</span>;
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  isLastInGroup
}) => {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
  {/* Avatar */}
{!isOwn && (
  <div className="flex-shrink-0">
    {showAvatar ? (
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback className="text-xs">
          {message.sender.displayName?.charAt(0) ||
            message.sender.username?.charAt(0) ||
            'U'}
        </AvatarFallback>
      </Avatar>
    ) : (
      <div className="w-8 h-8" />
    )}
  </div>
)}

      
      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender.displayName || message.sender.username}
          </span>
        )}
        
        <div
          className={`px-3 py-2.5 rounded-2xl shadow-sm transition-all hover:shadow-md ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          } ${isLastInGroup ? 'mb-2' : 'mb-1'}`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content.text}
          </p>
        </div>
        
        {isLastInGroup && (
          <div className={`flex items-center gap-2 text-xs px-3 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isOwn && (
              <>
                <span className="text-muted-foreground">•</span>
                <MessageStatusText status={message.messageStatus?.status || 'sent'} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
