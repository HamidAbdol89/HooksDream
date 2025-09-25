// CreatePostModal.tsx - Components hóa
import React, { useState, useRef, useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useSocial } from '@/hooks/useSocial';
import { api } from '@/services/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSuccessToast } from '@/components/ui/SuccessToast';
import { SessionWarningModal } from './modalpost/SessionWarningModal';
import { LoadingModal } from './modalpost/LoadingModal';
import { PostHeader } from './modalpost/PostHeader';
import { PostForm } from './modalpost/PostForm';
import { ActionBar } from './modalpost/ActionBar';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: any) => void;
  maxVideoSize?: number;
  maxImages?: number;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  isOpen, 
  onClose,
  onPostCreated,
  maxVideoSize = 100 * 1024 * 1024,
  maxImages = 4
}) => {
  const { t } = useTranslation('common');
const { isConnected, profile: currentUser } = useGoogleAuth();
  
  const { 
    useCurrentProfile, 
    clearAllCache, 
    currentUserId,
    refetchCurrentProfile 
  } = useSocial();
  
  const { 
    data: profileResponse, 
    isLoading: isProfileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useCurrentProfile();
  
  const profile = profileResponse?.data;

  const [content, setContent] = useState('');
  const [images, setImages] = useState<(string | File)[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const { showSuccess } = useSuccessToast();
  
  const [sessionWarning, setSessionWarning] = useState(false);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Check session consistency
  useEffect(() => {
    if (isOpen && currentUser && profile) {
      const isSessionConsistent = currentUser.id === profile._id;
      if (!isSessionConsistent) {
        console.warn('🚨 Session inconsistency detected:', {
          currentUserId: currentUser.id,
          profileId: profile._id
        });
        setSessionWarning(true);
        clearAllCache();
        setTimeout(() => {
          refetchCurrentProfile();
        }, 500);
      } else {
        setSessionWarning(false);
      }
    }
  }, [isOpen, currentUser, profile, clearAllCache, refetchCurrentProfile]);

  const getAuthToken = (): string | null => {
    const token = localStorage.getItem('auth_token') ||
                  localStorage.getItem('user_hash_id') || 
                  localStorage.getItem('hashId') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('userId') ||
                  sessionStorage.getItem('user_hash_id') ||
                  sessionStorage.getItem('hashId') ||
                  sessionStorage.getItem('token');
    
    console.log('🔍 Getting auth token:', token ? 'Found' : 'Not found');
    return token;
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        isTextExpanded ? 400 : 120
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, isTextExpanded]);

  // Xử lý upload nhiều ảnh
  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Kiểm tra số lượng ảnh tối đa
    if (images.length + files.length > maxImages) {
      toast({
        variant: "destructive",
        title: t('createPost.imageUpload.tooMany.title'),
        description: t('createPost.imageUpload.tooMany.description', { maxImages }),
      });
      return;
    }

    // Validate từng file
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB per image
        toast({
          variant: "destructive",
          title: t('createPost.imageUpload.tooLarge.title'),
          description: `${file.name} ${t('createPost.imageUpload.tooLarge.description')}`,
        });
        continue;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: t('createPost.imageUpload.invalidFile.title'),
          description: `${file.name} ${t('createPost.imageUpload.invalidFile.description')}`,
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Remove video if uploading images
    setVideo(null);

    // Convert files to data URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: t('createPost.imageUpload.readError.title'),
          description: `${file.name}: ${t('createPost.imageUpload.readError.description')}`,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa ảnh riêng lẻ
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Clear tất cả ảnh
  const clearAllImages = () => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxVideoSize) {
      toast({
        variant: "destructive",
        title: t('createPost.videoUpload.tooLarge.title'),
        description: t('createPost.videoUpload.tooLarge.description', { maxSize: maxVideoSize / (1024 * 1024) }),
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: t('createPost.videoUpload.invalidFile.title'),
        description: t('createPost.videoUpload.invalidFile.description'),
      });
      return;
    }

    setVideo(file);
    // Clear images when uploading video
    setImages([]);
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Session consistency check
    if (!currentUser || (!profile && !currentUser)) {
      toast({ 
        variant: 'destructive',
        title: t('createPost.sessionError.title'), 
        description: t('createPost.sessionError.inconsistent')
      });
      clearAllCache();
      return;
    }
    
    if (!isConnected) {
      toast({ 
        variant: 'destructive',
        title: t('createPost.authError.title'), 
        description: t('createPost.authError.web3NotConnected') 
      });
      return;
    }

    const token = getAuthToken();
    
    if (!token) {
      toast({ 
        variant: 'destructive',
        title: t('createPost.authError.title'), 
        description: t('createPost.authError.tokenNotFound') 
      });
      return;
    }

    if (!content.trim() && images.length === 0 && !video) {
      toast({ 
        variant: 'destructive',
        title: t('createPost.validationError.title'), 
        description: t('createPost.validationError.contentOrMediaRequired') 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls: string[] = [];
      let videoUrl = '';
        
      // Upload nhiều ảnh
      if (images.length > 0) {
        console.log(`🖼️ Starting upload for ${images.length} images...`);
        
        try {
          const uploadPromises = images.map(async (image, index) => {
            let fileToUpload: File;
            
            if (typeof image === 'string') {
              fileToUpload = dataURLtoFile(image, `image_${Date.now()}_${index}.jpg`);
            } else {
              fileToUpload = image;
            }
            
            const uploadResult = await api.post.uploadImage(fileToUpload);
            console.log(`🖼️ Image ${index + 1} uploaded:`, uploadResult);
            return uploadResult;
          });
          
          imageUrls = await Promise.all(uploadPromises);
          console.log('🖼️ All images uploaded successfully:', imageUrls);
          
        } catch (uploadError) {
          console.error('❌ Images upload error:', uploadError);
          const continueWithoutImages = window.confirm(
            t('createPost.imageUpload.failedConfirmation', {
              error: uploadError instanceof Error ? uploadError.message : t('createPost.imageUpload.unknownError')
            })
          );
          
          if (!continueWithoutImages) {
            throw new Error(t('createPost.imageUpload.failedError', {
              error: uploadError instanceof Error ? uploadError.message : t('createPost.imageUpload.unknownError')
            }));
          }
          
          console.log('📝 User chose to continue without images');
          imageUrls = [];
        }
      }

      // Upload video
      if (video) {
        console.log('🎥 Starting video upload...');
        try {
          const uploadResult = await api.post.uploadVideo(video);
          videoUrl = uploadResult;
          console.log('🎥 Upload successful, videoUrl:', videoUrl);
        } catch (uploadError) {
          console.error('❌ Video upload error:', uploadError);
          const continueWithoutVideo = window.confirm(
            t('createPost.videoUpload.failedConfirmation', {
              error: uploadError instanceof Error ? uploadError.message : t('createPost.videoUpload.unknownError')
            })
          );
          
          if (!continueWithoutVideo) {
            throw new Error(t('createPost.videoUpload.failedError', {
              error: uploadError instanceof Error ? uploadError.message : t('createPost.videoUpload.unknownError')
            }));
          }
          
          console.log('📝 User chose to continue without video');
          videoUrl = '';
        }
      }

      // Create post
      const postData = {
        content: content.trim(),
        images: imageUrls,
        video: videoUrl || undefined,
        userId: currentUser.id || (currentUser as any)._id || (currentUser as any).googleId,
      };

      console.log('📤 Creating post with data:', postData);
      
      const postResponse = await api.post.createPost(postData);

      if (!postResponse.success) {
        throw new Error(postResponse.message || t('createPost.failedGeneric'));
      }

      onPostCreated(postResponse.data);
      onClose();
      
      // Reset form
      setContent('');
      setImages([]);
      setVideo(null);
      setIsTextExpanded(false);

      showSuccess(
        t('createPost.success.title'),
        t('createPost.success.description'),
      );
      
    } catch (err) {
      console.error('❌ Create post error:', err);
      
      let errorMessage = t('createPost.unknownError');
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast({
        variant: 'destructive',
        title: t('createPost.failed.title'),
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    if (content.trim() || images.length > 0 || video) {
      const confirmClose = window.confirm(t('createPost.confirmClose'));
      if (!confirmClose) return;
    }
    
    setContent('');
    setImages([]);
    setVideo(null);
    setIsTextExpanded(false);
    onClose();
  };

  const hasContent = content.trim().length > 0 || images.length > 0 || !!video;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent 
          className={`
            p-0 sm:rounded-xl overflow-hidden
            ${isMobile 
              ? 'h-full max-h-full w-full max-w-full rounded-none' 
              : 'max-w-2xl h-auto max-h-[90vh]'
            }
          `}
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Accessibility components - hidden but required for screen readers */}
            <DialogTitle className="sr-only">
              {t('createPost.title', 'Create New Post')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('createPost.description', 'Create and share a new post with your followers')}
            </DialogDescription>
            
            {/* Header */}
            <PostHeader
              isMobile={isMobile}
              isSubmitting={isSubmitting}
              hasContent={hasContent}
              onClose={handleClose}
              onSubmit={handleSubmit}
            />
            
            {/* Main Content */}
            <PostForm
              profile={profile || currentUser}
              isMobile={isMobile}
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
              adjustTextareaHeight={adjustTextareaHeight}
            />

            {/* Action Bar */}
            <ActionBar
              isMobile={isMobile}
              isSubmitting={isSubmitting}
              images={images}
              video={video}
              content={content}
              maxImages={maxImages}
              onImageUpload={() => fileInputRef.current?.click()}
              onVideoUpload={() => {
                const videoInput = document.createElement('input');
                videoInput.type = 'file';
                videoInput.accept = 'video/*';
                videoInput.onchange = (e) => handleVideoUpload(e as any);
                videoInput.click();
              }}
            />
          </form>

          {/* Hidden file input for multiple images */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleMultipleImageUpload}
            className="hidden"
            disabled={isSubmitting || !!video || images.length >= maxImages}
          />
        </DialogContent>
      </Dialog>

      {/* Session Warning Modal */}
      <SessionWarningModal
        isOpen={sessionWarning}
        onClose={() => setSessionWarning(false)}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={isSubmitting}
        onClose={() => {}}
      />

   
    </>
  );
};

export default CreatePostModal;