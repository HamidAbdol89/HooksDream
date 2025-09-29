import React from 'react';
import { UserInfo } from './UserInfo';
import { ContentInput } from './ContentInput';
import { MediaPreview } from './MediaPreview';
import { useLinkPreview, useUrlExtraction } from '@/hooks/useLinkPreview';
import { LinkPreviews } from '../LinkPreview';

interface PostFormProps {
  profile: any;
  isMobile: boolean;
  content: string;
  setContent: (content: string) => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (expanded: boolean) => void;
  isSubmitting: boolean;
  images: (string | File)[];
  video: File | null;
  maxImages: number;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  removeVideo: () => void;
  adjustTextareaHeight: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({
  profile,
  isMobile,
  content,
  setContent,
  isTextExpanded,
  setIsTextExpanded,
  isSubmitting,
  images,
  video,
  maxImages,
  removeImage,
  clearAllImages,
  removeVideo,
  adjustTextareaHeight
}) => {
  const { hasUrls } = useUrlExtraction();
  const { previews, fetchMultiplePreviews, isLoading, clearPreviews } = useLinkPreview();

  // Auto-fetch link previews when content changes
  React.useEffect(() => {
    if (hasUrls(content)) {
      fetchMultiplePreviews(content);
    } else {
      clearPreviews();
    }
  }, [content, hasUrls, fetchMultiplePreviews, clearPreviews]);

  return (
    <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3' : 'px-4'}`}>
      
      {/* User Info */}
      <UserInfo profile={profile} isMobile={isMobile} />

      {/* Content Input */}
      <div className={`space-y-4 ${isMobile ? 'py-3' : 'py-4'}`}>
        <ContentInput
          content={content}
          setContent={setContent}
          isTextExpanded={isTextExpanded}
          setIsTextExpanded={setIsTextExpanded}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
          adjustTextareaHeight={adjustTextareaHeight}
        />

        {/* Link Previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <LinkPreviews previews={previews} maxPreviews={2} />
          </div>
        )}

        {/* Loading indicator for link previews */}
        {isLoading && hasUrls(content) && (
          <div className="p-3 border border-dashed border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating link preview...
            </div>
          </div>
        )}

        <MediaPreview
          images={images}
          video={video}
          isMobile={isMobile}
          maxImages={maxImages}
          removeImage={removeImage}
          clearAllImages={clearAllImages}
          removeVideo={removeVideo}
        />
      </div>
    </div>
  );
};