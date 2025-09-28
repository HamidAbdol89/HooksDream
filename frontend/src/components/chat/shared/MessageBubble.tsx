// components/chat/shared/MessageBubble.tsx - Shared message bubble for both desktop and mobile
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Message } from '@/types/chat';
import { ImageLightbox } from './ImageLightbox';
import { MessageActions } from './MessageActions';
import { EditMessageModal } from './EditMessageModal';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  conversationId: string;
  isLatestMessage?: boolean; // Tin nhắn mới nhất trong conversation
}

// Message Status Text Component
const MessageStatusText: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation('common');
  
  switch (status) {
    case 'sending':
      return <span className="text-muted-foreground text-xs">{t('chat.messageStatus.sending')}</span>;
    case 'sent':
      return <span className="text-muted-foreground text-xs">{t('chat.messageStatus.sent')}</span>;
    case 'delivered':
      return <span className="text-muted-foreground text-xs">{t('chat.messageStatus.delivered')}</span>;
    case 'read':
      return <span className="text-blue-500 text-xs">{t('chat.messageStatus.read')}</span>;
    case 'failed':
      return <span className="text-red-500 text-xs">{t('chat.messageStatus.failed')}</span>;
    case 'recalled':
      return <span className="text-muted-foreground text-xs">{t('chat.messageStatus.recalled')}</span>;
    default:
      return <span className="text-muted-foreground text-xs">{t('chat.messageStatus.sent')}</span>;
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  isLastInGroup,
  conversationId,
  isLatestMessage = false
}) => {
  const { t } = useTranslation('common');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { token } = useGoogleAuth();
  
  const { editMessage, recallMessage } = useMessageActions(conversationId);

  // Copy text function
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Handle message click to show/hide actions (chỉ cho tin nhắn cũ)
  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    // Tin nhắn mới nhất không cần click để toggle
    if (!isLatestMessage) {
      setIsSelected(!isSelected);
    }
  };

  // Handle edit message
  const handleEdit = (messageId: string) => {
    setEditingMessage(message);
  };

  const handleRecall = async (messageId: string) => {
    if (confirm(t('chat.messageActions.recallConfirm'))) {
      try {
        await recallMessage(messageId);
      } catch (error) {
        alert(t('chat.messageActions.recallFailed'));
      }
    }
  };

  const handleSaveEdit = async (messageId: string, newText: string) => {
    await editMessage(messageId, newText);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  
  return (
    <div className={`group flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
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
      <div
        className={`flex flex-col max-w-[280px] sm:max-w-xs lg:max-w-md ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender name (nếu là người khác) */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender.displayName || message.sender.username}
          </span>
        )}
  
        {/* Nội dung bubble */}
        <div
          onClick={handleMessageClick}
          className={`rounded-2xl shadow-sm transition-all hover:shadow-md ${
            isLatestMessage ? 'cursor-default' : 'cursor-pointer'
          } ${
            message.content.isRecalled
              ? 'bg-muted/50 text-muted-foreground border border-dashed'
              : isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          } ${isLastInGroup ? 'mb-2' : 'mb-0.5'} ${
            message.content.image || message.content.video ? 'p-1' : 'px-3 py-2.5'
          }`}
        >
          {/* Image content */}
          {message.content.image && (
            <div className="relative">
              <img
                src={message.content.image}
                alt="Shared image"
                className="max-w-full h-auto rounded-xl max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxImage(message.content.image!)}
                onError={(e) => {
                  e.currentTarget.src = '/default-image.jpg';
                }}
              />
              {/* Text overlay */}
              {message.content.text && (
                <div
                  className={`absolute bottom-0 left-0 right-0 p-2 rounded-b-xl ${
                    isOwn ? 'bg-primary/80' : 'bg-muted/80'
                  } backdrop-blur-sm`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {message.content.text}
                  </p>
                </div>
              )}
            </div>
          )}
  
          {/* Video content */}
          {message.content.video && (
            <div className="relative">
              <video
                ref={videoRef}
                src={message.content.video.url}
                className="max-w-full h-auto rounded-xl max-h-80 object-cover"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
                controls
                preload="metadata"
              />
  
              {/* Duration */}
              {message.content.video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(message.content.video.duration)}
                </div>
              )}
  
              {/* Text overlay */}
              {message.content.text && (
                <div
                  className={`absolute bottom-0 left-0 right-0 p-2 rounded-b-xl ${
                    isOwn ? 'bg-primary/80' : 'bg-muted/80'
                  } backdrop-blur-sm`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {message.content.text}
                  </p>
                </div>
              )}
            </div>
          )}
  
          {/* Text-only */}
          {message.content.text &&
            !message.content.image &&
            !message.content.video && (
              <div>
                {message.content.isRecalled ? (
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 opacity-50" />
                    <p className="text-sm italic opacity-70">
                      {message.content.text}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content.text}
                  </p>
                )}
                {message.isEdited && !message.content.isRecalled && (
                  <span className="text-xs opacity-70 italic mt-1 block">
                    {t('chat.editMessage.edited')}
                  </span>
                )}
              </div>
            )}
        </div>
  
        {/* Actions - Show when selected OR for latest message */}
        <div
          className={`flex items-center gap-2 text-xs px-3 transition-all duration-300 ${
            (isSelected || isLatestMessage) ? 'mt-2 opacity-100 max-h-10' : 'mt-0 opacity-0 max-h-0 overflow-hidden'
          } ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
        >
          {/* Time + Status - Show when selected, last in group, or latest message */}
          {(isSelected || isLastInGroup || isLatestMessage) && (
            <>
              <span className="text-muted-foreground">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
    
              {isOwn && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <MessageStatusText
                    status={message.messageStatus?.status || 'sent'}
                  />
                </>
              )}
            </>
          )}

          {/* Actions - Show when selected OR for latest message */}
          {(isSelected || isLatestMessage) && (
            <div className="flex">
              <MessageActions
                message={message}
                isOwn={isOwn}
                onEdit={handleEdit}
                onRecall={handleRecall}
                onCopy={copyText}
              />
            </div>
          )}
        </div>
      </div>
  
      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          alt="Chat image"
        />
      )}
  
      {/* Edit Message Modal */}
      <EditMessageModal
        message={editingMessage}
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
  

  
};
