import React from 'react';
import { UserInfo } from './UserInfo';
import { ContentInput } from './ContentInput';
import { MediaPreview } from './MediaPreview';

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