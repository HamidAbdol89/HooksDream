import React from 'react';
import { Image, Video, Smile } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface ActionBarProps {
  isMobile: boolean;
  isSubmitting: boolean;
  images: (string | File)[];
  video: File | null;
  content: string;
  maxImages: number;
  onImageUpload: () => void;
  onVideoUpload: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isMobile,
  isSubmitting,
  images,
  video,
  content,
  maxImages,
  onImageUpload,
  onVideoUpload
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={`
      sticky bottom-0 bg-background/95 backdrop-blur 
      supports-[backdrop-filter]:bg-background/60 border-t 
      ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}
    `}>
      <div className="flex items-center justify-between">
        
        {/* Left Actions */}
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-1'}`}>
          
          {/* Multiple Images Upload */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`
                  text-muted-foreground hover:text-primary
                  ${isMobile ? 'h-10 w-10' : 'h-9 w-9'}
                  ${images.length >= maxImages ? 'opacity-50' : ''}
                `}
                disabled={isSubmitting || !!video || images.length >= maxImages}
                onClick={onImageUpload}
              >
                <Image className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {images.length >= maxImages 
                  ? t('createPost.imageUpload.maxReached', { maxImages })
                  : t('createPost.imageUpload.addImages', { 
                      current: images.length, 
                      max: maxImages 
                    })
                }
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Video Upload */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`text-muted-foreground hover:text-primary ${isMobile ? 'h-10 w-10' : 'h-9 w-9'}`}
                disabled={isSubmitting || images.length > 0}
                onClick={onVideoUpload}
              >
                <Video className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t('createPost.uploadVideo')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Emoji Picker (Placeholder) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`text-muted-foreground hover:text-primary ${isMobile ? 'h-10 w-10' : 'h-9 w-9'}`}
                disabled={isSubmitting}
              >
                <Smile className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{t('createPost.addEmoji')}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Character count indicator */}
        <div className="flex items-center">
          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {content.length}/5000
          </span>
          {content.length > 4500 && (
            <span className={`ml-2 ${content.length > 4900 ? 'text-destructive' : 'text-amber-500'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
              ({5000 - content.length} {t('createPost.charsLeft')})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};