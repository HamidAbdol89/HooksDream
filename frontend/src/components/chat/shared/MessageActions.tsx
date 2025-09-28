// components/chat/shared/MessageActions.tsx - Message action menu for edit/recall
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Edit3, RotateCcw, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Message } from '@/types/chat';

interface MessageActionsProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: string) => void;
  onRecall: (messageId: string) => void;
  onCopy: (text: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isOwn,
  onEdit,
  onRecall,
  onCopy
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
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-3 h-3" />
      </Button>

      {/* Menu dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className={`absolute z-20 bg-background border rounded-lg shadow-lg py-1 min-w-32 ${
            isOwn ? 'right-0' : 'left-0'
          }`}>
            {/* Copy text */}
            {message.content.text && (
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                {t('chat.messageActions.copy')}
              </button>
            )}

            {/* Edit (only for own text messages) */}
            {canEdit && (
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Edit3 className="w-3 h-3" />
                {t('chat.messageActions.edit')}
              </button>
            )}

            {/* Recall (only for own messages) */}
            {canRecall && (
              <button
                onClick={handleRecall}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
              >
                <RotateCcw className="w-3 h-3" />
                {t('chat.messageActions.recall')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
