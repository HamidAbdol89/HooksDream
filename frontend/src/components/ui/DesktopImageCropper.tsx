import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/slider';

interface DesktopImageCropperProps {
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

export const DesktopImageCropper: React.FC<DesktopImageCropperProps> = ({
  imageUrl,
  aspectRatio = 1,
  onCrop,
  onCancel,
  title = 'Crop Image',
  cropType = 'avatar'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
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

    // Determine crop window size based on container viewport
    let cropWidth: number;
    let cropHeight: number;
    if (cropType === 'avatar') {
      const size = Math.min(vw, vh) * 0.6; // 60% of the smaller container edge
      cropWidth = size;
      cropHeight = size;
    } else {
      // 3:1 for cover - better desktop sizing
      const maxWidth = vw * 0.75; // 75% of container width
      const maxHeight = vh * 0.4;  // 40% of container height
      
      // Calculate based on 3:1 ratio
      cropWidth = maxWidth;
      cropHeight = cropWidth / 3;
      
      // If height is too big, constrain by height
      if (cropHeight > maxHeight) {
        cropHeight = maxHeight;
        cropWidth = cropHeight * 3;
      }
      
      // Ensure reasonable minimum size
      if (cropWidth < 400) {
        cropWidth = 400;
        cropHeight = 133; // 400/3
      }
    }

    // Center the crop area in the container
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

  // Recompute crop window on container resize
  useEffect(() => {
    const onResize = () => initializeCropArea();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initializeCropArea]);

  // Handle image load
  const handleImageLoad = () => {
    initializeCropArea();
  };

  // Mouse event handlers for drag-to-adjust
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - imageTransform.x, 
      y: e.clientY - imageTransform.y 
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setImageTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
    
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel event for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(3, imageTransform.scale + delta));
    
    setImageTransform(prev => ({
      ...prev,
      scale: newScale
    }));
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

  const handleZoomChange = (value: number[]) => {
    setImageTransform(prev => ({
      ...prev,
      scale: value[0]
    }));
  };

  // Update preview canvas - use same algorithm as getCroppedImage
  const updatePreview = useCallback(() => {
    if (!previewCanvasRef.current || !imageRef.current || !containerRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;

    if (!ctx) return;

    // Set canvas size
    const previewWidth = cropType === 'avatar' ? 200 : 300;
    const previewHeight = cropType === 'avatar' ? 200 : 100;
    
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Clear canvas
    ctx.clearRect(0, 0, previewWidth, previewHeight);

    // Use EXACT same calculation as getCroppedImage
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
      ctx.translate(previewWidth / 2, previewHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-previewWidth / 2, -previewHeight / 2);
    }

    // Draw the cropped image - EXACT same logic as getCroppedImage
    if (finalSourceW > 0 && finalSourceH > 0 && sourceX < img.naturalWidth && sourceY < img.naturalHeight) {
      ctx.drawImage(
        img,
        sourceX, sourceY, finalSourceW, finalSourceH,
        0, 0, previewWidth, previewHeight
      );
    } else {
      // Fallback: draw the whole image if crop calculation fails
      ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
    }
  }, [cropArea, imageTransform, rotation, cropType]);

  // Update preview when values change
  useEffect(() => {
    if (imageLoaded) {
      updatePreview();
    }
  }, [imageLoaded, cropArea, imageTransform, rotation, updatePreview]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-6 p-6 min-h-0">
          {/* Left side - Image editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div 
              ref={containerRef}
              className="flex-1 relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-move min-h-[400px]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
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

            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Slider
                  value={[imageTransform.scale]}
                  onValueChange={handleZoomChange}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                  {Math.round(imageTransform.scale * 100)}%
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="px-3"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetTransform}
                className="px-3"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Right side - Preview and info */}
          <div className="w-80 flex flex-col gap-6">
            <div>
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Preview</h3>
              
              {/* Large Preview */}
              <div 
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4"
                style={{ 
                  aspectRatio: cropType === 'avatar' ? '1' : '3/1',
                  width: cropType === 'avatar' ? '200px' : '300px'
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-cover rounded-lg"
                  style={{
                    width: cropType === 'avatar' ? '200px' : '300px',
                    height: cropType === 'avatar' ? '200px' : '100px'
                  }}
                />
              </div>
              
              {/* Info */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Output:</span>
                  <span>{cropType === 'avatar' ? '400×400px' : '1200×400px'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ratio:</span>
                  <span>{cropType === 'avatar' ? '1:1' : '3:1'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom:</span>
                  <span>{Math.round(imageTransform.scale * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rotation:</span>
                  <span>{rotation}°</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Output: {cropType === 'avatar' ? '400×400px (1:1)' : '1200×400px (3:1)'}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              className="min-w-[120px]"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
