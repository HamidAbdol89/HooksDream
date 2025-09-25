import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface MediaPreviewProps {
  images: (string | File)[];
  video: File | null;
  isMobile: boolean;
  maxImages: number;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  removeVideo: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  images,
  video,
  isMobile,
  maxImages,
  removeImage,
  clearAllImages,
  removeVideo
}) => {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Multiple Images Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {images.length} {t('createPost.images')} ({images.length}/{maxImages})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllImages}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t('createPost.clearAll')}
            </Button>
          </div>
          
          {/* Images Grid - Responsive */}
          <div className={`
            grid gap-2 
            ${images.length === 1 ? 'grid-cols-1' : 
              images.length === 2 ? 'grid-cols-2' : 
              'grid-cols-2 sm:grid-cols-3'
            }
          `}>
            {images.map((image, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border group">
                <img
                  src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className={`
                    w-full object-cover bg-muted
                    ${images.length === 1 ? 'max-h-[300px]' : 
                      isMobile ? 'h-24' : 'h-32'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className={`
                    absolute bg-black/70 text-white rounded-full 
                    hover:bg-black/80 transition-colors
                    opacity-0 group-hover:opacity-100
                    ${isMobile ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'}
                  `}
                >
                  <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                </button>
                {/* Image number indicator */}
                <div className={`
                  absolute bottom-1 left-1 bg-black/70 text-white text-xs 
                  rounded px-1.5 py-0.5 font-medium
                `}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview */}
      {video && (
        <div className="relative rounded-lg overflow-hidden border">
          <video
            src={URL.createObjectURL(video)}
            controls
            className={`w-full object-contain bg-muted ${isMobile ? 'max-h-[200px]' : 'max-h-[300px]'}`}
          />
          <button
            type="button"
            onClick={removeVideo}
            className={`
              absolute bg-black/70 text-white rounded-full 
              hover:bg-black/80 transition-colors
              ${isMobile ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'}
            `}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
};