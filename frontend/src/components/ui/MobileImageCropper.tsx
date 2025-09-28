import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileImageCropperProps {
  imageUrl: string;
  aspectRatio?: number; // width/height, default 1 (square)
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  title?: string;
  cropType?: 'avatar' | 'cover';
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MobileImageCropper: React.FC<MobileImageCropperProps> = ({
  imageUrl,
  aspectRatio = 1,
  onCrop,
  onCancel,
  title = 'Crop Image',
  cropType = 'avatar'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Initialize crop area when image loads - default center focus
  const initializeCropArea = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const { width: vw, height: vh } = container.getBoundingClientRect();

    // Determine crop window size based on viewport, not image size
    let cropWidth: number;
    let cropHeight: number;
    if (cropType === 'avatar') {
      const size = Math.min(vw, vh) * 0.7; // 70% of the smaller viewport edge
      cropWidth = size;
      cropHeight = size;
    } else {
      // 3:1 for cover - better sizing
      const maxWidth = vw * 0.85; // 85% of viewport width
      const maxHeight = vh * 0.4;  // 40% of viewport height
      
      // Calculate based on 3:1 ratio
      cropWidth = maxWidth;
      cropHeight = cropWidth / 3;
      
      // If height is too big, constrain by height
      if (cropHeight > maxHeight) {
        cropHeight = maxHeight;
        cropWidth = cropHeight * 3;
      }
      
      // Ensure minimum size
      if (cropWidth < 300) {
        cropWidth = 300;
        cropHeight = 100;
      }
    }

    // Center the crop area in the viewport
    const x = (vw - cropWidth) / 2;
    const y = (vh - cropHeight) / 2;

    setCropArea({ x, y, width: cropWidth, height: cropHeight });
    setImageLoaded(true);
  }, [aspectRatio, cropType]);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      initializeCropArea();
    }
  }, [initializeCropArea]);

  // Recompute crop window on viewport resize
  useEffect(() => {
    const onResize = () => initializeCropArea();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initializeCropArea]);

  // Lock background scroll while cropper is open and force fullscreen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.documentElement.style.height;
    const originalPosition = document.body.style.position;
    
    // Lock scroll and force fullscreen
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    
    // Prevent touch events from affecting browser UI
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    
    // Add event listeners to prevent browser UI changes
    document.addEventListener('touchstart', preventTouch, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('scroll', preventScroll, { passive: false });
    
    // Hide address bar on mobile
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.height = originalHeight;
      
      document.removeEventListener('touchstart', preventTouch);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);

  // Handle image load
  const handleImageLoad = () => {
    initializeCropArea();
  };

  // Touch event handlers for drag-to-adjust
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent browser UI from showing
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ 
        x: touch.clientX - imageTransform.x, 
        y: touch.clientY - imageTransform.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent browser UI from showing
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    setImageTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Prevent browser UI from showing
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
  };

  // Pinch to zoom
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 2) {
      setInitialDistance(getTouchDistance(e.touches));
      setInitialScale(imageTransform.scale);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 2 && initialDistance > 0) {
      const currentDistance = getTouchDistance(e.touches);
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.max(0.5, Math.min(3, initialScale * scaleChange));
      
      setImageTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  };

  const handleMultiTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      handleTouchStart(e);
    } else if (e.touches.length === 2) {
      handlePinchStart(e);
    }
  };

  const handleMultiTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 1) {
      handleTouchMove(e);
    } else if (e.touches.length === 2) {
      handlePinchMove(e);
    }
  };

  // Crop the image - fixed algorithm
  const getCroppedImage = useCallback(async (): Promise<Blob> => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) {
      throw new Error('Required elements not available');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;

    if (!ctx) throw new Error('Canvas context not available');

    // Set output dimensions
    const outputWidth = cropType === 'avatar' ? 400 : 1200;
    const outputHeight = cropType === 'avatar' ? 400 : 400;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Clear canvas
    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate image display size (object-contain)
    const scaleToDisplay = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight);
    const displayedImgWidth = img.naturalWidth * scaleToDisplay;
    const displayedImgHeight = img.naturalHeight * scaleToDisplay;
    
    // Image position in container (center + transform)
    const imgX = (containerWidth - displayedImgWidth) / 2 + imageTransform.x;
    const imgY = (containerHeight - displayedImgHeight) / 2 + imageTransform.y;
    
    // Calculate which part of the original image is in the crop area - ROBUST VERSION
    const scaleFactorX = img.naturalWidth / (displayedImgWidth * imageTransform.scale);
    const scaleFactorY = img.naturalHeight / (displayedImgHeight * imageTransform.scale);
    
    const sourceX = Math.max(0, (cropArea.x - imgX) * scaleFactorX);
    const sourceY = Math.max(0, (cropArea.y - imgY) * scaleFactorY);
    const sourceW = Math.min(img.naturalWidth - sourceX, cropArea.width * scaleFactorX);
    const sourceH = Math.min(img.naturalHeight - sourceY, cropArea.height * scaleFactorY);
    
    // Ensure positive dimensions
    const finalSourceW = Math.max(1, sourceW);
    const finalSourceH = Math.max(1, sourceH);

    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }

    // Draw the cropped image - ensure we have valid dimensions
    if (finalSourceW > 0 && finalSourceH > 0 && sourceX < img.naturalWidth && sourceY < img.naturalHeight) {
      ctx.drawImage(
        img,
        sourceX, sourceY, finalSourceW, finalSourceH,
        0, 0, outputWidth, outputHeight
      );
    } else {
      // Fallback: draw the whole image if crop calculation fails
      console.warn('Crop calculation failed, using whole image');
      ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg', 0.9);
    });
  }, [cropArea, imageTransform, rotation, cropType]);

  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImage();
      onCrop(croppedBlob);
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetTransform = () => {
    setImageTransform({ x: 0, y: 0, scale: 1 });
    setRotation(0);
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '100vh',
        zIndex: 10000,
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-black/90 backdrop-blur text-white z-10">
        <h2 className="text-lg font-medium">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main crop area - Full viewport */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ 
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          minWidth: '100vw',
          minHeight: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          contain: 'layout style paint',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        onTouchStart={handleMultiTouch}
        onTouchMove={handleMultiTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image Container - Fixed size to prevent layout shift */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop"
            className="absolute w-full h-full object-contain"
            style={{
              transform: `translate(${imageTransform.x}px, ${imageTransform.y}px) scale(${imageTransform.scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              willChange: 'transform',
              touchAction: 'none',
              left: '50%',
              top: '50%',
              marginLeft: '-50%',
              marginTop: '-50%'
            }}
            onLoad={handleImageLoad}
            draggable={false}
          />
        </div>

        {/* Crop overlay - absolutely fixed position */}
        {imageLoaded && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 5
            }}
          >
            {/* Dark overlay */}
            <div 
              className="absolute inset-0 bg-black/50"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
            
            {/* Crop window - completely fixed */}
            <div
              ref={cropOverlayRef}
              className="absolute border-2 border-white shadow-lg"
              style={{
                position: 'absolute',
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                transform: 'translateZ(0)', // Force GPU layer
                backfaceVisibility: 'hidden'
              }}
            >
              {/* Corner indicators */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-2 border-white bg-blue-500 rounded-full" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-2 border-white bg-blue-500 rounded-full" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-2 border-white bg-blue-500 rounded-full" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-2 border-white bg-blue-500 rounded-full" />
              
              {/* Center drag indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <Move className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Instructions - Fixed position */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur z-20"
          style={{
            position: 'absolute',
            top: '80px', // Fixed distance from top
            left: '50%',
            transform: 'translateX(-50%) translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          📱 Drag to move • Pinch to zoom
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur p-4 space-y-4 z-10">
        {/* Quick actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-white/20"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTransform}
            className="text-white hover:bg-white/20 text-sm"
          >
            Reset
          </Button>
          
          <div className="text-white text-sm">
            {Math.round(imageTransform.scale * 100)}%
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
