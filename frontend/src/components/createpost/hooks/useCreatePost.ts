// src/components/createpost/hooks/useCreatePost.ts
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UseCreatePostReturn {
  // Content state
  content: string;
  setContent: (content: string) => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (expanded: boolean) => void;
  
  // Media state
  images: File[];
  video: File | null;
  maxImages: number;
  
  // Submission state
  isSubmitting: boolean;
  
  // Actions
  handleImageUpload: () => void;
  handleVideoUpload: () => void;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  removeVideo: () => void;
  handleSubmit: () => Promise<void>;
  
  // File handlers
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Refs
  imageInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

export const useCreatePost = (): UseCreatePostReturn => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  
  // Content state
  const [content, setContent] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  
  // Media state
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const maxImages = 4;
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Image upload handler
  const handleImageUpload = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  // Video upload handler
  const handleVideoUpload = useCallback(() => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    // Validate file sizes (10MB max per image)
    const validSizedImages = validImages.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`Image ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validSizedImages].slice(0, maxImages));
    
    // Clear input
    if (event.target) {
      event.target.value = '';
    }
  }, [maxImages]);

  // Handle video selection
  const handleVideoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Validate file size (100MB max for video)
      if (file.size > 100 * 1024 * 1024) {
        console.warn('Video file is too large (max 100MB)');
        return;
      }
      
      setVideo(file);
      setImages([]); // Clear images when video is selected
    }
    
    // Clear input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setImages([]);
  }, []);

  // Remove video
  const removeVideo = useCallback(() => {
    setVideo(null);
  }, []);

  // Submit post
  const handleSubmit = useCallback(async () => {
    if (!content.trim() && images.length === 0 && !video) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      
      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Add video
      if (video) {
        formData.append('video', video);
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_hash_id')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      // Navigate back to feed
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  }, [content, images, video, navigate]);

  return {
    // Content state
    content,
    setContent,
    isTextExpanded,
    setIsTextExpanded,
    
    // Media state
    images,
    video,
    maxImages,
    
    // Submission state
    isSubmitting,
    
    // Actions
    handleImageUpload,
    handleVideoUpload,
    removeImage,
    clearAllImages,
    removeVideo,
    handleSubmit,
    
    // File handlers
    handleImageSelect,
    handleVideoSelect,
    
    // Refs
    imageInputRef,
    videoInputRef
  };
};
