// components/chat/shared/MessageInput.tsx - Shared message input for both desktop and mobile
import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useMessageStatus } from '@/hooks/useMessageStatus';

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  disabled = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessageWithStatus } = useMessageStatus(conversationId);

  const handleSend = async () => {
    if (!messageText.trim() || isSending || disabled) return;
    
    setIsSending(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    try {
      const result = await sendMessageWithStatus(messageText.trim(), tempId);
      if (result.success) {
        setMessageText('');
      }
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
    <div className="p-4 md:p-4 border-t bg-background md:bg-card/50 md:backdrop-blur-sm safe-area-inset-bottom">
      <div className="flex items-center gap-3">
        {/* Camera button - Instagram style (mobile only) */}
        <Button variant="ghost" size="sm" className="md:hidden h-10 w-10 p-0 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
        
        {/* Desktop attachment button */}
        <Button variant="ghost" size="sm" className="hidden md:flex h-10 w-10 p-0 rounded-full">
          <Paperclip className="w-4 h-4" />
        </Button>
        <div className="flex-1 relative">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={messageText ? "" : "Message..."}
            className="pr-20 md:pr-12 py-3 rounded-full border-2 focus:border-primary/50 transition-colors text-base md:text-sm bg-muted/50 md:bg-background"
            disabled={isSending || disabled}
          />
          
          {/* Right side buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Emoji button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            {/* Send button */}
            <Button 
              size="sm" 
              onClick={handleSend}
              disabled={!messageText.trim() || isSending || disabled}
              className="h-8 w-8 p-0 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation"
            >
              {isSending ? (
                <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
