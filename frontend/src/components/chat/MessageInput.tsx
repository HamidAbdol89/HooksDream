// components/chat/MessageInput.tsx
import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!messageText.trim() || isSending || disabled) return;
    
    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
      <div className="flex items-end gap-3">
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
          <Paperclip className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="pr-12 py-3 rounded-full border-2 focus:border-primary/50 transition-colors"
            disabled={isSending || disabled}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleSend}
          disabled={!messageText.trim() || isSending || disabled}
          className="h-10 w-10 p-0 rounded-full transition-all hover:scale-105 active:scale-95"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
