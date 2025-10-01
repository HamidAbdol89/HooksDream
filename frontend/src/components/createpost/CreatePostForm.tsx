// src/components/createpost/CreatePostForm.tsx
import React, { useRef, useCallback } from 'react';
import { UserInfo } from './UserInfo';
import { ContentInput } from './ContentInput';
import { MediaPreview } from './MediaPreview';
import { ActionBar } from './ActionBar';
import { useLinkPreview, useUrlExtraction } from '@/hooks/useLinkPreview';
import { LinkPreviews } from '../posts/LinkPreview';

interface CreatePostFormProps {
  profile: any;
  content: string;
  setContent: (content: string) => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (expanded: boolean) => void;
  isSubmitting: boolean;
  images: File[];
  video: File | null;
  maxImages: number;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  removeVideo: () => void;
  onImageUpload: () => void;
  onVideoUpload: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  profile,
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
  onImageUpload,
  onVideoUpload
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { hasUrls } = useUrlExtraction();
  const { previews, fetchMultiplePreviews, clearPreviews } = useLinkPreview();

  // Auto-adjust textarea height
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Auto-fetch link previews when content changes
  React.useEffect(() => {
    if (hasUrls(content)) {
      fetchMultiplePreviews(content);
    } else {
      clearPreviews();
    }
  }, [content, hasUrls, fetchMultiplePreviews, clearPreviews]);

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          
          {/* User Info */}
          <UserInfo profile={profile} />

          {/* Content Input */}
          <ContentInput
            ref={textareaRef}
            content={content}
            setContent={setContent}
            isTextExpanded={isTextExpanded}
            setIsTextExpanded={setIsTextExpanded}
            isSubmitting={isSubmitting}
            adjustTextareaHeight={adjustTextareaHeight}
          />

          {/* Link Previews */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <LinkPreviews previews={previews} maxPreviews={2} />
            </div>
          )}

          {/* Media Preview */}
          <MediaPreview
            images={images}
            video={video}
            maxImages={maxImages}
            removeImage={removeImage}
            clearAllImages={clearAllImages}
            removeVideo={removeVideo}
          />
        </div>
      </div>

      {/* Action Bar - Sticky Bottom */}
      <ActionBar
        isSubmitting={isSubmitting}
        images={images}
        video={video}
        content={content}
        maxImages={maxImages}
        onImageUpload={onImageUpload}
        onVideoUpload={onVideoUpload}
      />
    </div>
  );
};
