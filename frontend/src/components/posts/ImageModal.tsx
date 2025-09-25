// src/components/posts/ImageModal.tsx
import React, { useState, useEffect, useTransition, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Download, Share, Flag, MoreHorizontal,
  ZoomIn, ZoomOut, RotateCw, Maximize2
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { 
  useFloating, 
  useClick, 
  useDismiss, 
  useRole, 
  useInteractions, 
  offset, 
  flip 
} from '@floating-ui/react';

import { isMobile } from 'react-device-detect';



interface ImageModalProps {
  images: string[];
  currentIndex: number;
  content?: string;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  onIndexChange: (index: number) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentIndex,
  content,
  onClose,
  onNext,
  onPrev,
  onDownload,
  onIndexChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showUI, setShowUI] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isPending, startTransition] = useTransition(); // Added for smooth index change
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isMobileDevice] = useState(isMobile);

  const { refs, floatingStyles, context } = useFloating({
    open: isMenuOpen,
    onOpenChange: setIsMenuOpen,
    placement: 'bottom-end',
    middleware: [offset(8), flip()],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  // Auto-hide UI after 3 seconds of inactivity
  useEffect(() => {
    if (!showUI) return;
    
    const timer = setTimeout(() => {
      setShowUI(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showUI]);

  // Reset states when image changes
  useEffect(() => {
    setImageLoaded(false);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          images.length > 1 && onPrev();
          break;
        case 'ArrowRight':
          images.length > 1 && onNext();
          break;
        case ' ':
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNext, onPrev, zoomLevel, images.length]);

  const toggleZoom = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setShowUI(true);
    
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      // Added damping for smoother pan
      requestAnimationFrame(() => {
        setPanPosition({ x: newX, y: newY });
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y
      };
    } else if (e.touches.length === 2) {
      // Basic pinch-to-zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: dist, y: 0 }; // Store initial distance
    }
  };

const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
    const newX = e.touches[0].clientX - (touchStartRef.current?.x || 0);
    const newY = e.touches[0].clientY - (touchStartRef.current?.y || 0);
    
    // Thêm deadzone cho mobile để tránh scroll nhẹ
    if (isMobileDevice && Math.abs(newX) < 5 && Math.abs(newY) < 5) return;
    
    requestAnimationFrame(() => {
      setPanPosition({ x: newX, y: newY });
    });
  } else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = dist / (touchStartRef.current?.x || 1);
      setZoomLevel(prev => Math.max(1, Math.min(4, prev * scaleChange))); // Limit zoom 1-4x
      touchStartRef.current = { x: dist, y: 0 };
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) { // Double click to zoom
      toggleZoom();
    }
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleIndexChange = (index: number) => {
    startTransition(() => {
      onIndexChange(index);
    });
  };

  return (
    <Portal containerId="portal-root">
      <div
        className="image-modal-container fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog" // Added ARIA
        aria-modal="true"
        aria-label="Image viewer modal"
      >
        {/* Top Controls Bar */}
        <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            {/* Left side - Image counter */}
            <div className="flex items-center space-x-4">
              {images.length > 1 && (
                <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
            
            {/* Right side - Controls */}
            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <button
                onClick={toggleZoom}
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10"
                title={zoomLevel > 1 ? "Thu nhỏ" : "Phóng to"}
                aria-label={zoomLevel > 1 ? "Zoom out" : "Zoom in"}
              >
                {zoomLevel > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              
              {/* Rotate */}
              <button
                onClick={rotateImage}
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10"
                title="Xoay ảnh"
                aria-label="Rotate image"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              
              {/* More options menu */}
              <div className="relative">
                <button 
                  ref={refs.setReference}
                  {...getReferenceProps()}
                  className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10"
                  title="Thêm tùy chọn"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {isMenuOpen && (
                  <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    {...getFloatingProps()}
                    className="w-52 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
                    role="menu"
                  >
                    <button
                      onClick={() => {
                        onDownload();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors text-gray-900 dark:text-gray-100"
                      aria-label="Download image"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium">Tải xuống</span>
                    </button>
                    
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors text-gray-900 dark:text-gray-100"
                      aria-label="Share image"
                    >
                      <Share className="w-4 h-4" />
                      <span className="font-medium">Chia sẻ</span>
                    </button>
                    
                    <div className="h-px bg-gray-200/50 dark:bg-gray-700/50" />
                    
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-red-50/70 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                      aria-label="Report image"
                    >
                      <Flag className="w-4 h-4" />
                      <span className="font-medium">Báo cáo</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10"
                title="Đóng"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className={`absolute left-4 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              title="Ảnh trước"
              aria-label="Previous image"
              disabled={isPending}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={onNext}
              className={`absolute right-4 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 border border-white/10 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              title="Ảnh tiếp theo"
              aria-label="Next image"
              disabled={isPending}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Main Image Display */}
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <div className="text-white/70 text-sm">Đang tải...</div>
                </div>
              </div>
            )}
            
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}${content ? `: ${content}` : ''}`}
              className={`transition-all duration-500 rounded-lg shadow-2xl select-none will-change-transform ${
                zoomLevel > 1 
                  ? 'cursor-grab active:cursor-grabbing' 
                  : 'cursor-zoom-in max-w-full max-h-full object-contain'
              } ${isDragging ? 'cursor-grabbing' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isPending ? 'blur-sm' : ''}`}
              style={{ 
                transform: `rotate(${rotation}deg) scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                transformOrigin: 'center center',
                maxWidth: zoomLevel === 1 ? '100%' : 'none',
                maxHeight: zoomLevel === 1 ? '100%' : 'none'
              }}
              onClick={handleImageClick}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              draggable={false}
            />
          </div>
        </div>
        
        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Image navigation thumbnails */}
            {images.length > 1 && images.length <= 10 && (
              <div className="flex justify-center space-x-2 mb-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleIndexChange(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden transition-all duration-200 border-2 hover:scale-105 ${
                      index === currentIndex ? 'border-white shadow-lg' : 'border-white/30 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                    disabled={isPending}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Image navigation dots for many images */}
            {images.length > 10 && (
              <div className="flex justify-center space-x-2 mb-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleIndexChange(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-white scale-125 shadow-lg' : 'bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                    disabled={isPending}
                  />
                ))}
              </div>
            )}
            
            {/* Image caption */}
            {content && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-xl text-sm leading-relaxed border border-white/10">
                  {content}
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </Portal>
  );
};