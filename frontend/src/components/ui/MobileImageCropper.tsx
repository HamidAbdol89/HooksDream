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
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Initialize crop area when image loads - default center focus
  const initializeCropArea = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate display size maintaining aspect ratio
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    let displayWidth, displayHeight;
    if (imgAspectRatio > containerAspectRatio) {
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imgAspectRatio;
    } else {
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imgAspectRatio;
    }

    // Calculate crop area size based on desired aspect ratio
    const maxCropSize = Math.min(displayWidth, displayHeight) * 0.8;
    let cropWidth, cropHeight;
    
    if (cropType === 'avatar') {
      // Square crop for avatar
      cropWidth = cropHeight = maxCropSize;
    } else {
      // 3:1 ratio for cover
      cropWidth = maxCropSize;
      cropHeight = maxCropSize / 3;
    }

    // Center the crop area - DEFAULT CENTER FOCUS
    const x = (displayWidth - cropWidth) / 2;
    const y = (displayHeight - cropHeight) / 2;

    setCropArea({ x, y, width: cropWidth, height: cropHeight });
    setImageLoaded(true);
  }, [aspectRatio, cropType]);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      initializeCropArea();
    }
  }, [initializeCropArea]);

  // Handle image load
  const handleImageLoad = () => {
    initializeCropArea();
  };

  // Touch event handlers for drag-to-adjust
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ 
        x: touch.clientX - imageTransform.x, 
        y: touch.clientY - imageTransform.y 
      });
    }
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    setImageTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
    
    e.preventDefault();
  };

  const handleTouchEnd = () => {
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
    if (e.touches.length === 2) {
      setInitialDistance(getTouchDistance(e.touches));
      setInitialScale(imageTransform.scale);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
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
    if (e.touches.length === 1) {
      handleTouchStart(e);
    } else if (e.touches.length === 2) {
      handlePinchStart(e);
    }
  };

  const handleMultiTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleTouchMove(e);
    } else if (e.touches.length === 2) {
      handlePinchMove(e);
    }
  };

  // Crop the image
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

    // Calculate the actual crop area on the original image
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Scale factors
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Calculate crop area in original image coordinates
    const cropX = (cropArea.x - (imgRect.left - containerRect.left)) * scaleX / imageTransform.scale;
    const cropY = (cropArea.y - (imgRect.top - containerRect.top)) * scaleY / imageTransform.scale;
    const cropWidth = cropArea.width * scaleX / imageTransform.scale;
    const cropHeight = cropArea.height * scaleY / imageTransform.scale;

    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }

    // Draw the cropped image
    ctx.drawImage(
      img,
      Math.max(0, cropX),
      Math.max(0, cropY),
      Math.min(cropWidth, img.naturalWidth),
      Math.min(cropHeight, img.naturalHeight),
      0,
      0,
      outputWidth,
      outputHeight
    );

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
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur text-white">
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

      {/* Main crop area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ height: 'calc(100vh - 140px)' }}
        onTouchStart={handleMultiTouch}
        onTouchMove={handleMultiTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            transform: `translate(${imageTransform.x}px, ${imageTransform.y}px) scale(${imageTransform.scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            willChange: 'transform',
            touchAction: 'none'
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Crop overlay - fixed center position */}
        {imageLoaded && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Crop window */}
            <div
              ref={cropOverlayRef}
              className="absolute border-2 border-white shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                width: cropType === 'avatar' ? '280px' : '320px',
                height: cropType === 'avatar' ? '280px' : '107px',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
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

        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur">
          📱 Drag to move • Pinch to zoom
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black/90 backdrop-blur p-4 space-y-4">
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
