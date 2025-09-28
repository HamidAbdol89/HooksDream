// components/chat/shared/MessageActions.tsx - Message action menu for edit/recall
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MoreHorizontal, Copy, Edit3, RotateCcw, Reply } from 'lucide-react';
import { Message } from '@/types/chat';
import { useTranslation } from 'react-i18next';
import { useMessageActions } from '@/hooks/useMessageActions';

interface MessageActionsProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: string) => void;
  onRecall: (messageId: string) => void;
  onCopy: (text: string) => void;
  onReply: (message: Message) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isOwn,
  onEdit,
  onRecall,
  onCopy,
  onReply
}) => {
  const { t } = useTranslation('common');
  const [showMenu, setShowMenu] = useState(false);

  // Check if message can be edited (within 24 hours, text only, not deleted, not recalled)
  const canEdit = isOwn && 
    message.content.text && 
    !message.isDeleted &&
    !message.content.isRecalled &&
    (Date.now() - new Date(message.createdAt).getTime()) < 24 * 60 * 60 * 1000;

  // Check if message can be recalled (within 24 hours, not deleted, not recalled)
  const canRecall = isOwn && 
    !message.isDeleted &&
    !message.content.isRecalled &&
    (Date.now() - new Date(message.createdAt).getTime()) < 24 * 60 * 60 * 1000;

  // Don't show actions for recalled messages
  if (message.content.isRecalled) {
    return null;
  }

  const handleEdit = () => {
    onEdit(message._id);
    setShowMenu(false);
  };

  const handleRecall = () => {
    onRecall(message._id);
    setShowMenu(false);
  };

  const handleCopy = () => {
    if (message.content.text) {
      onCopy(message.content.text);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      {/* Animated Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 w-8 p-0 rounded-full bg-muted focus:outline-none focus:ring-0 transition-all duration-200 active:scale-95 animate-in zoom-in-50 fade-in duration-300"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {/* Menu dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Animated Menu */}
          <div className={`absolute z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-32 ${
            isOwn ? 'right-0 bottom-full mb-2' : 'left-0 bottom-full mb-2'
          } animate-in slide-in-from-bottom-2 fade-in duration-200`}>
            {/* Copy text */}
            {message.content.text && (
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm focus:outline-none focus:ring-0 flex items-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Copy className="w-4 h-4" />
                {t('chat.messageActions.copy')}
              </button>
            )}

            {/* Edit (only for own text messages) */}
            {canEdit && (
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm focus:outline-none focus:ring-0 flex items-center gap-2 transition-all duration-200 active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                {t('chat.messageActions.edit')}
              </button>
            )}

            {/* Recall (only for own messages) */}
            {canRecall && (
              <button
                onClick={handleRecall}
                className="w-full px-3 py-2 text-left text-sm focus:outline-none focus:ring-0 flex items-center gap-2 text-red-600 dark:text-red-400 transition-all duration-200 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                {t('chat.messageActions.recall')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
