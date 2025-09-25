// src/components/posts/hooks/useImageModal.ts
import { useState, useCallback, useEffect } from 'react';

export const useImageModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);

  const getImageUrl = useCallback((imagePath: string): string => {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseURL = process.env.REACT_APP_API_URL || 
                   process.env.REACT_APP_BASE_URL || 
                   `${window.location.protocol}//${window.location.hostname}:5000` || 
                   `${window.location.origin}`;
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseURL}/${cleanPath}`;
  }, []);

  const openImageModal = useCallback((images: string[] = [], index: number = 0) => {
    setModalImages(images.map(img => getImageUrl(img)));
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }, [getImageUrl]);

  const closeImageModal = useCallback(() => {
    setIsModalOpen(false);
    setModalImages([]);
    setModalImageIndex(0);
    document.body.style.overflow = 'unset';
    document.body.classList.remove('modal-open');
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.log);
    }
  }, []);

  const goToNextImage = useCallback(() => {
    if (modalImageIndex < modalImages.length - 1) {
      setModalImageIndex(modalImageIndex + 1);
    } else if (modalImages.length > 1) {
      setModalImageIndex(0);
    }
  }, [modalImageIndex, modalImages.length]);

  const goToPrevImage = useCallback(() => {
    if (modalImageIndex > 0) {
      setModalImageIndex(modalImageIndex - 1);
    } else if (modalImages.length > 1) {
      setModalImageIndex(modalImages.length - 1);
    }
  }, [modalImageIndex, modalImages.length]);

  const downloadImage = useCallback(() => {
    const imageUrl = modalImages[modalImageIndex];
    const userName = 'user'; // You might want to pass this as a parameter
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${userName}-${timestamp}-image.jpg`;
    
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Lỗi khi tải ảnh:', error);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }, [modalImages, modalImageIndex]);

  // Keyboard and touch event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch(e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case ' ':
          goToNextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, modalImageIndex, closeImageModal, goToNextImage, goToPrevImage]);

  return {
    isModalOpen,
    modalImageIndex,
    modalImages,
    openImageModal,
    closeImageModal,
    goToNextImage,
    goToPrevImage,
    downloadImage,
    setModalImageIndex
  };
};