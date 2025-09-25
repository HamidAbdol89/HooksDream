import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface PostHeaderProps {
  isMobile: boolean;
  isSubmitting: boolean;
  hasContent: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PostHeader: React.FC<PostHeaderProps> = ({
  isMobile,
  isSubmitting,
  hasContent,
  onClose,
  onSubmit
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={`
      sticky top-0 z-10 bg-background/95 backdrop-blur 
      supports-[backdrop-filter]:bg-background/60 border-b 
      ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}
    `}>
      <div className="flex items-center justify-between">
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`}
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
          </Button>
        </DialogClose>
        
        <h2 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
          {t('createPost.title')}
        </h2>
        
        <Button
          type="submit"
          disabled={isSubmitting || !hasContent}
          className={`rounded-full font-medium ${isMobile ? 'h-9 px-4 text-sm' : 'h-8 px-4 text-sm'}`}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              {isMobile ? t('createPost.posting') : t('createPost.posting')}
            </>
          ) : (
            t('createPost.post')
          )}
        </Button>
      </div>
    </div>
  );
};