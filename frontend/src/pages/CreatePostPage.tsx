// src/pages/CreatePostPage.tsx
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useSocial } from '@/hooks/useSocial';
import { CreatePostForm } from '@/components/createpost/CreatePostForm';
import { useCreatePost } from '@/components/createpost/hooks/useCreatePost';
import { TooltipProvider } from '@radix-ui/react-tooltip';

export const CreatePostPage: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { profile, user } = useAppStore();
  const { useCurrentProfile } = useSocial();
  const { data: currentProfileData } = useCurrentProfile();
  const currentUserProfile = currentProfileData?.data;

  // Use the custom hook for post creation logic
  const {
    content,
    setContent,
    isTextExpanded,
    setIsTextExpanded,
    images,
    video,
    maxImages,
    isSubmitting,
    handleImageUpload,
    handleVideoUpload,
    removeImage,
    clearAllImages,
    removeVideo,
    handleSubmit,
    imageInputRef,
    videoInputRef,
    handleImageSelect,
    handleVideoSelect
  } = useCreatePost();

  // User display data
  const profileData = {
    displayName: currentUserProfile?.displayName || profile?.displayName || user?.name || 'User',
    avatar: currentUserProfile?.avatar || profile?.avatar || '',
    username: currentUserProfile?.username || profile?.username || user?.name || 'user',
    email: currentUserProfile?.email || profile?.email || user?.email || ''
  };

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const canPost = content.trim() || images.length > 0 || video;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {t('feed.createPost.title', 'Tạo bài viết')}
              </h1>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!canPost || isSubmitting}
              className="px-6"
            >
              {isSubmitting ? t('feed.createPost.posting', 'Đang đăng...') : t('feed.createPost.post', 'Đăng')}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <CreatePostForm
            profile={profileData}
            content={content}
            setContent={setContent}
            isTextExpanded={isTextExpanded}
            setIsTextExpanded={setIsTextExpanded}
            isSubmitting={isSubmitting}
            images={images}
            video={video}
            maxImages={maxImages}
            removeImage={removeImage}
            clearAllImages={clearAllImages}
            removeVideo={removeVideo}
            onImageUpload={handleImageUpload}
            onVideoUpload={handleVideoUpload}
          />
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
};
