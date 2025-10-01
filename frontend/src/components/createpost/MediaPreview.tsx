// src/components/createpost/MediaPreview.tsx
import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface MediaPreviewProps {
  images: File[];
  video: File | null;
  maxImages: number;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  removeVideo: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  images,
  video,
  maxImages,
  removeImage,
  clearAllImages,
  removeVideo
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-4">
      {/* Multiple Images Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {images.length} {t('createPost.images', 'ảnh')} ({images.length}/{maxImages})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllImages}
              className="h-8 px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('createPost.clearAll', 'Xóa tất cả')}
            </Button>
          </div>
          
          {/* Images Grid - Responsive */}
          <div className={`
            grid gap-3 
            ${images.length === 1 ? 'grid-cols-1' : 
              images.length === 2 ? 'grid-cols-2' : 
              'grid-cols-2 md:grid-cols-3'
            }
          `}>
            {images.map((image, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border group bg-muted">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className={`
                    w-full object-cover
                    ${images.length === 1 ? 'max-h-[400px]' : 'h-32 md:h-40'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="
                    absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5
                    hover:bg-black/80 transition-colors
                    opacity-0 group-hover:opacity-100
                  "
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Image number indicator */}
                <div className="
                  absolute bottom-2 left-2 bg-black/70 text-white text-xs 
                  rounded px-2 py-1 font-medium
                ">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview */}
      {video && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t('createPost.video', 'Video')}
            </span>
          </div>
          
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <video
              src={URL.createObjectURL(video)}
              controls
              className="w-full max-h-[400px] object-contain"
            />
            <button
              type="button"
              onClick={removeVideo}
              className="
                absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5
                hover:bg-black/80 transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
