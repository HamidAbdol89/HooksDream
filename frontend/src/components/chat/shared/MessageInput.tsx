// components/chat/shared/MessageInput.tsx
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Send, Smile, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import TextareaAutosize from "react-textarea-autosize";
import { useMessageStatus } from "@/hooks/useMessageStatus";
import { ImageUpload } from "./ImageUpload";
import { VideoUpload } from "./VideoUpload";
import { AudioRecorder } from "./AudioRecorder";

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessageWithStatus } = useMessageStatus(conversationId);
  const [showMore, setShowMore] = useState(false);

  const handleSend = async () => {
    if (!messageText.trim() || isSending || disabled) return;
    setIsSending(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    try {
      const result = await sendMessageWithStatus(messageText.trim(), tempId);
      if (result.success) setMessageText("");
    } finally {
      setIsSending(false);
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
<div className="p-3 border-t bg-background safe-area-inset-bottom sticky bottom-0 z-20 rounded-t-2xl md:bg-card/50 md:backdrop-blur-sm">
<div className="flex items-end gap-2"> {/* Changed from items-center to items-end */}
        
        {/* MOBILE: toggle menu */}
        <div className="md:hidden mb-2"> {/* Added margin-bottom */}
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full flex items-center justify-center"
            onClick={() => setShowMore((v) => !v)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* DESKTOP: always show upload buttons */}
        <div className="hidden md:flex items-center gap-2 mb-2"> {/* Added margin-bottom */}
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

        {/* Input + Send - FIXED */}
        <div className="flex-1 min-w-0 relative"> {/* Removed rounded-full and border */}
          <div className="bg-muted/50 md:bg-background border-2 rounded-full overflow-hidden"> {/* Wrapper với rounded-full */}
            <TextareaAutosize
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.messageInput.placeholder')}
              minRows={1}
              maxRows={5}
              className="w-full resize-none py-2 px-4 pr-12 bg-transparent outline-none text-base md:text-sm border-none" /* Removed border */
              disabled={isSending || disabled}
            />
            
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleSend}
                disabled={!messageText.trim() || isSending || disabled}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
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
  );
};