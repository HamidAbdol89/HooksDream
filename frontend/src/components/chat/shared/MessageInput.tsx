// components/chat/shared/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, Plus } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useTranslation } from 'react-i18next';
import { useMessageStatus } from '@/hooks/useMessageStatus';
import { Message } from '@/types/chat';
import { ImageUpload } from './ImageUpload';
import { VideoUpload } from './VideoUpload';
import { AudioRecorder } from './AudioRecorder';
import { ReplyPreview } from './ReplyPreview';

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}
export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  disabled = false,
  replyingTo,
  onCancelReply
}) => {
  const { t } = useTranslation('common');
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessageWithStatus } = useMessageStatus(conversationId);
  const [showMore, setShowMore] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and setup auto-focus - only on desktop, not mobile
  useEffect(() => {
    const checkIsMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkIsMobile);
    
    const focusTextarea = () => {
      if (textareaRef.current && !disabled && !checkIsMobile) {
        textareaRef.current.focus();
      }
    };

    // Focus immediately (desktop only)
    focusTextarea();

    // Also focus when clicking anywhere in the chat area (desktop only)
    const handleDocumentClick = (e: MouseEvent) => {
      if (checkIsMobile) return; // Skip on mobile
      
      // Only focus if not clicking on interactive elements
      const target = e.target as HTMLElement;
      if (!target.closest('button, input, textarea, [contenteditable], a, .no-focus')) {
        focusTextarea();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [conversationId, disabled]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending || disabled) return;
    
    const textToSend = messageText.trim();
    setMessageText(""); // Clear immediately for better UX
    setIsSending(true);
    
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    try {
      // Send message with replyTo support
      const result = await sendMessageWithStatus(textToSend, tempId, replyingTo);
      if (!result.success) {
        // Restore text if failed
        setMessageText(textToSend);
      } else {
        // Clear reply after successful send
        if (replyingTo && onCancelReply) {
          onCancelReply();
        }
      }
    } finally {
      setIsSending(false);
      // Re-focus textarea after sending (desktop only)
      setTimeout(() => {
        if (textareaRef.current && !disabled && !isMobile) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaSent = () => {};

  return (
    <div className="border-t border-border bg-background safe-area-inset-bottom sticky bottom-0 z-20">
      {/* Reply Preview */}
      <ReplyPreview 
        replyingTo={replyingTo || null}
        onCancelReply={onCancelReply || (() => {})}
      />
      
      <div className="p-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">{/* Clean container */}
        
        {/* MOBILE: toggle menu */}
        <div className="md:hidden mb-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-muted focus:outline-none focus:ring-0 transition-colors active:scale-95"
            onClick={() => setShowMore((v) => !v)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* DESKTOP: always show upload buttons */}
        <div className="hidden md:flex items-center gap-3 mb-2">{/* Modern spacing */}
          <ImageUpload
            conversationId={conversationId}
            onImageSent={handleMediaSent}
            disabled={disabled}
          />
          <VideoUpload
            conversationId={conversationId}
            onVideoSent={handleMediaSent}
            disabled={disabled}
          />
          <AudioRecorder
            conversationId={conversationId}
            onAudioSent={handleMediaSent}
            disabled={disabled}
          />
        </div>

        {/* Clean Input + Send */}
        <div className="flex-1 min-w-0 relative">
          <div className="bg-muted/50 border border-border rounded-2xl overflow-hidden"> 
            <TextareaAutosize
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.messageInput.placeholder')}
              minRows={1}
              maxRows={5}
              className="w-full resize-none py-3 px-4 pr-14 bg-transparent outline-none focus:outline-none focus:ring-0 text-base placeholder:text-muted-foreground border-none"
              disabled={isSending || disabled}
              autoFocus={!isMobile}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-500 focus:outline-none focus:ring-0 transition-all duration-200 active:scale-95 disabled:scale-100"
                onClick={handleSend}
                disabled={!messageText.trim() || isSending || disabled}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: expandable menu */}
      {showMore && (
        <div className="flex items-center gap-4 mt-2 md:hidden animate-in fade-in slide-in-from-bottom-2">
          <ImageUpload
            conversationId={conversationId}
            onImageSent={handleMediaSent}
            disabled={disabled}
          />
          <VideoUpload
            conversationId={conversationId}
            onVideoSent={handleMediaSent}
            disabled={disabled}
          />
          <AudioRecorder
            conversationId={conversationId}
            onAudioSent={handleMediaSent}
            disabled={disabled}
          />
        </div>
      )}
      </div>
    </div>
  );
};