// components/chat/shared/EditMessageModal.tsx - Modal for editing messages
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Message } from '@/types/chat';

interface EditMessageModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (messageId: string, newText: string) => Promise<void>;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  isOpen,
  onClose,
  onSave
}) => {
  const { t } = useTranslation('common');
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (message && isOpen) {
      setEditText(message.content.text || '');
    }
  }, [message, isOpen]);

  const handleSave = async () => {
    if (!message || !editText.trim()) return;

    setIsSaving(true);
    try {
      await onSave(message._id, editText.trim());
      onClose();
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t('chat.editMessage.title')}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Original message info */}
            <div className="text-xs text-muted-foreground">
              Sent {new Date(message.createdAt).toLocaleString()}
              {message.isEdited && (
                <span className="ml-2">(Previously edited)</span>
              )}
            </div>

            {/* Edit input */}
            <div>
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Edit your message..."
                className="w-full"
                disabled={isSaving}
                autoFocus
              />
            </div>

            {/* Edit history */}
            {message.editHistory && message.editHistory.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Edit History:
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {message.editHistory.map((edit, index) => (
                    <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground mb-1">
                        {new Date(edit.editedAt).toLocaleString()}
                      </div>
                      <div className="text-foreground">{edit.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time limit warning */}
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⏰ You can edit messages within 24 hours of sending
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('chat.editMessage.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editText.trim()}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t('commonv2.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('chat.editMessage.save')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
