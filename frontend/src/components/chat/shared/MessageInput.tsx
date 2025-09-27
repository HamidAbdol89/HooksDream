// components/chat/shared/MessageInput.tsx - Shared message input for both desktop and mobile
import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useMessageStatus } from '@/hooks/useMessageStatus';
import { ImageUpload } from './ImageUpload';

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

  const handleImageSent = () => {
    // Refresh messages or handle image sent callback
    // The real-time update will be handled by socket
  };

  return (
<div
  className="p-4 border-t bg-background md:bg-card/50 md:backdrop-blur-sm 
    safe-area-inset-bottom sticky bottom-0 z-20 rounded-t-2xl"
>

      <div className="flex items-center gap-3">
   
        
        {/* Image upload button */}
        <ImageUpload
          conversationId={conversationId}
          onImageSent={handleImageSent}
          disabled={disabled}
        />
        
        {/* Desktop attachment button (for other files) */}
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
