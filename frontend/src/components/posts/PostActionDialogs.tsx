// src/components/posts/PostActionDialogs.tsx
import React from 'react';
import { Archive, Trash2, Flag, AlertTriangle } from 'lucide-react';
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

interface PostActionDialogsProps {
  // Archive Dialog
  isArchiveOpen: boolean;
  onArchiveClose: () => void;
  onArchiveConfirm: () => void;
  isArchiving?: boolean;
  
  // Delete Dialog
  isDeleteOpen: boolean;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  isDeleting?: boolean;
  
  // Report Dialog
  isReportOpen: boolean;
  onReportClose: () => void;
  onReportConfirm: () => void;
  isReporting?: boolean;
  
  // Post content for preview
  postContent?: string;
}

export const PostActionDialogs: React.FC<PostActionDialogsProps> = ({
  isArchiveOpen,
  onArchiveClose,
  onArchiveConfirm,
  isArchiving = false,
  isDeleteOpen,
  onDeleteClose,
  onDeleteConfirm,
  isDeleting = false,
  isReportOpen,
  onReportClose,
  onReportConfirm,
  isReporting = false,
  postContent
}) => {
  const { t } = useTranslation('common');

  const handleArchiveConfirm = () => {
    onArchiveConfirm();
    onArchiveClose();
  };

  const handleDeleteConfirm = () => {
    onDeleteConfirm();
    onDeleteClose();
  };

  const handleReportConfirm = () => {
    onReportConfirm();
    onReportClose();
  };

  return (
    <>
      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveOpen} onOpenChange={onArchiveClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Archive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  {t('post.confirmArchive', 'Archive Post')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  {t('post.confirmArchiveDesc', 'Archive this post? You can restore it within 30 days.')}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {/* Post Preview */}
          {postContent && (
            <div className="my-4 p-3 bg-muted/50 rounded-lg border-l-4 border-orange-500">
              <p className="text-sm text-muted-foreground mb-1">
                {t('post.postPreview', 'Post content:')}
              </p>
              <p className="text-sm line-clamp-3">
                {postContent}
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isArchiving}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </AlertDialogCancel>
            
            <AlertDialogAction asChild>
              <Button 
                onClick={handleArchiveConfirm}
                disabled={isArchiving}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isArchiving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {t('post.archiving', 'Archiving...')}
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    {t('post.archive', 'Archive')}
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  {t('post.confirmDelete', 'Delete Post')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  {t('post.confirmDeleteDesc', 'Are you sure you want to delete this post? This action cannot be undone.')}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {/* Post Preview */}
          {postContent && (
            <div className="my-4 p-3 bg-muted/50 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-muted-foreground mb-1">
                {t('post.postPreview', 'Post content:')}
              </p>
              <p className="text-sm line-clamp-3">
                {postContent}
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isDeleting}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </AlertDialogCancel>
            
            <AlertDialogAction asChild>
              <Button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                variant="destructive"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {t('post.deleting', 'Deleting...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('post.delete', 'Delete')}
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Confirmation Dialog */}
      <AlertDialog open={isReportOpen} onOpenChange={onReportClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <Flag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  {t('post.confirmReport', 'Report Post')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  {t('post.confirmReportDesc', 'Report this post for inappropriate content? Our team will review it.')}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {/* Post Preview */}
          {postContent && (
            <div className="my-4 p-3 bg-muted/50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-muted-foreground mb-1">
                {t('post.postPreview', 'Post content:')}
              </p>
              <p className="text-sm line-clamp-3">
                {postContent}
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isReporting}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </AlertDialogCancel>
            
            <AlertDialogAction asChild>
              <Button 
                onClick={handleReportConfirm}
                disabled={isReporting}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isReporting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {t('post.reporting', 'Reporting...')}
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    {t('post.report', 'Report')}
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
