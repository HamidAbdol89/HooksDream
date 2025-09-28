// components/chat/shared/RepliedMessage.tsx
import React from 'react';
import { Reply } from 'lucide-react';
import { Message } from '@/types/chat';

interface RepliedMessageProps {
  repliedMessage: Message;
  onClick?: () => void;
}

export const RepliedMessage: React.FC<RepliedMessageProps> = ({
  repliedMessage,
  onClick
}) => {
  const getPreviewText = (message: Message) => {
    if (message.content.text) {
      return message.content.text.length > 50 
        ? message.content.text.substring(0, 50) + '...'
        : message.content.text;
    }
    if (message.content.image) return '📷 Ảnh';
    if (message.content.video) return '🎥 Video';
    if (message.content.audio) return '🎵 Âm thanh';
    return 'Tin nhắn';
  };

  return (
    <div 
      className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-l-2 border-orange-400 px-2 py-1.5 mb-2 rounded-r cursor-pointer hover:from-orange-500/25 hover:to-yellow-500/25 transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5">
        <Reply className="w-3 h-3 text-orange-300 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-orange-100 mb-0.5">
            {repliedMessage.sender.displayName || repliedMessage.sender.username}
          </div>
          <div className="text-xs text-orange-200/90 truncate">
            {getPreviewText(repliedMessage)}
          </div>
        </div>
      </div>
    </div>
  );
};
