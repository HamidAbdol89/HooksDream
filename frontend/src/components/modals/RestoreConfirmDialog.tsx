// src/components/modals/RestoreConfirmDialog.tsx
import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/Button';

interface RestoreConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  postContent?: string;
}

export const RestoreConfirmDialog: React.FC<RestoreConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  postContent
}) => {
  const { t } = useTranslation('common');

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                {t('archivedPosts.confirmRestore', 'Restore Post')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                {t('archivedPosts.confirmRestoreDesc', 'This post will be restored to your feed and visible to your followers.')}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Post Preview */}
        {postContent && (
          <div className="my-4 p-3 bg-muted/50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-muted-foreground mb-1">
              {t('archivedPosts.postPreview', 'Post content:')}
            </p>
            <p className="text-sm line-clamp-3">
              {postContent}
            </p>
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {t('archivedPosts.restoring', 'Restoring...')}
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('archivedPosts.restore', 'Restore')}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
