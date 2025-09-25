import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface SessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { t } = useTranslation('common');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Session Inconsistency</h3>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Detected session inconsistency. Refreshing user data...
          </p>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Refreshing...</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};