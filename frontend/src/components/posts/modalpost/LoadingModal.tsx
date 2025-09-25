import React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface LoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { t } = useTranslation('common');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">{t('common.loading')}</span>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};