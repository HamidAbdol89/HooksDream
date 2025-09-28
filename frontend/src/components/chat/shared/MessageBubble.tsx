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

// Clean Message Status Component with Text + Icons
const MessageStatusText: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation('common');
  
  switch (status) {
    case 'sending':
      return (
        <span className="text-muted-foreground text-xs opacity-70">
          {t('chat.messageStatus.sending')}
        </span>
      );
    case 'sent':
      return (
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">✓</span>
          <span className="text-muted-foreground text-xs">{t('chat.messageStatus.sent')}</span>
        </div>
      );
    case 'delivered':
      return (
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">✓✓</span>
          <span className="text-muted-foreground text-xs">{t('chat.messageStatus.delivered')}</span>
        </div>
      );
    case 'read':
      return (
        <div className="flex items-center gap-1">
          <span className="text-blue-500 text-xs">✓✓</span>
          <span className="text-blue-500 text-xs">{t('chat.messageStatus.read')}</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-1">
          <span className="text-red-500 text-xs">⚠</span>
          <span className="text-red-500 text-xs">{t('chat.messageStatus.failed')}</span>
        </div>
      );
    case 'recalled':
      return (
        <div className="flex items-center gap-1">
          <RotateCcw className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{t('chat.messageStatus.recalled')}</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">✓</span>
          <span className="text-muted-foreground text-xs">{t('chat.messageStatus.sent')}</span>
        </div>
      );
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
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
  
        {/* Nội dung bubble - With Smooth Animations & Sending State */}
        <div
          onClick={handleMessageClick}
          className={`relative ${message.content.image || message.content.video ? '' : 'rounded-2xl'} transition-all duration-300 ease-out transform ${message.content.image || message.content.video ? '' : 'active:scale-[0.98]'} ${
            isLatestMessage ? 'cursor-default' : 'cursor-pointer'
          } ${
            message.content.isRecalled
              ? 'bg-muted text-muted-foreground border border-dashed border-border'
              : (message.content.image || message.content.video)
              ? '' // No background for media messages
              : isOwn
              ? 'bg-blue-500 text-white rounded-br-md shadow-sm'
              : 'bg-card text-foreground shadow-sm border border-border rounded-bl-md'
          } ${isLastInGroup ? 'mb-3' : 'mb-1.5'} ${
            message.content.image || message.content.video ? 'p-0' : 'px-4 py-3'
          } ${
            isSelected ? 'shadow-lg scale-[1.02]' : ''
          } ${
            message.messageStatus?.status === 'sending' ? 'opacity-60 animate-pulse' : 'opacity-100'
          } transition-opacity duration-700 ease-out animate-in slide-in-from-bottom-1 fade-in duration-300`}
        >
          {/* Image content */}
          {message.content.image && (
            <div className="relative">
              <img
                src={message.content.image}
                alt="Shared image"
                className="max-w-full h-auto max-h-80 object-cover cursor-pointer transition-opacity rounded-xl"
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
                className="max-w-full h-auto max-h-80 object-cover rounded-xl"
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
  
        {/* Actions - Smooth Slide Animation */}
        <div
          className={`flex items-center gap-3 text-xs px-2 transition-all duration-500 ease-out ${
            (isSelected || isLatestMessage) ? 'mt-3 opacity-100 max-h-12 transform translate-y-0' : 'mt-0 opacity-0 max-h-0 overflow-hidden transform -translate-y-2'
          } ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
        >
          {/* Time + Status - With Animation */}
          {(isSelected || isLastInGroup || isLatestMessage) && (
            <div className={`flex items-center gap-2 px-3 py-1 bg-muted rounded-full animate-in slide-in-from-left-2 fade-in duration-300 transition-opacity duration-700 ease-out ${
              message.messageStatus?.status === 'sending' ? 'opacity-70' : 'opacity-100'
            }`}>
              <span className="text-muted-foreground text-xs">
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
            </div>
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
});
