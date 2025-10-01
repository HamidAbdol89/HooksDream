// src/components/createpost/ActionBar.tsx
import React from 'react';
import { Image, Video, Smile, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

interface ActionBarProps {
  isSubmitting: boolean;
  images: File[];
  video: File | null;
  content: string;
  maxImages: number;
  onImageUpload: () => void;
  onVideoUpload: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
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
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between">
          
          {/* Left Actions */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              {t('feed.createPost.addToPost', 'Thêm vào bài viết')}
            </span>
            
            {/* Multiple Images Upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`
                    text-muted-foreground hover:text-green-600 p-2
                    ${images.length >= maxImages ? 'opacity-50' : ''}
                  `}
                  disabled={isSubmitting || !!video || images.length >= maxImages}
                  onClick={onImageUpload}
                >
                  <Image className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>
                  {images.length >= maxImages 
                    ? t('createPost.imageUpload.maxReached', `Tối đa ${maxImages} ảnh`)
                    : t('createPost.imageUpload.addImages', `Thêm ảnh (${images.length}/${maxImages})`)
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
                  size="sm"
                  className="text-muted-foreground hover:text-blue-600 p-2"
                  disabled={isSubmitting || images.length > 0}
                  onClick={onVideoUpload}
                >
                  <Video className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('createPost.uploadVideo', 'Thêm video')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Emoji Picker (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-yellow-600 p-2"
                  disabled={isSubmitting}
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('createPost.addEmoji', 'Thêm emoji')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Location (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-600 p-2"
                  disabled={isSubmitting}
                >
                  <MapPin className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('createPost.addLocation', 'Thêm vị trí')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Tag People (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-purple-600 p-2"
                  disabled={isSubmitting}
                >
                  <Users className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('createPost.tagPeople', 'Gắn thẻ người')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Character count indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-sm">
              {content.length}/5000
            </span>
            {content.length > 4500 && (
              <span className={`text-sm ${content.length > 4900 ? 'text-destructive' : 'text-amber-500'}`}>
                ({5000 - content.length} {t('createPost.charsLeft', 'còn lại')})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
