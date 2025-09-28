// components/chat/shared/ReplyPreview.tsx
import React from 'react';
import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Message } from '@/types/chat';

interface ReplyPreviewProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyingTo,
  onCancelReply
}) => {
  if (!replyingTo) return null;

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
    <div className="bg-muted/50 border-l-4 border-blue-500 px-3 py-2 mx-4 mb-2 rounded-r-lg animate-in slide-in-from-left-2 fade-in duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Reply className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              Trả lời {replyingTo.sender.displayName || replyingTo.sender.username}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {getPreviewText(replyingTo)}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full hover:bg-muted/80 flex-shrink-0"
          onClick={onCancelReply}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
