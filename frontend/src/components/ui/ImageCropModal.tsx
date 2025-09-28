import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Crop, X, Move, Smartphone, Monitor } from 'lucide-react';

// ✅ Simple crop implementation without external library
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  cropType: 'avatar' | 'cover';
  onCropComplete: (croppedFile: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  cropType,
  onCropComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  
  // ✅ Refs for performance optimization
  const lastUpdateTime = useRef(0);
  const animationFrame = useRef<number | null>(null);

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Load image when file changes
  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
        // ✅ Cleanup animation frame
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }
  }, [imageFile]);

  // ✅ Set default crop area based on type
  React.useEffect(() => {
    if (imageFile && imageRef.current) {
      const img = imageRef.current;
      const aspectRatio = cropType === 'avatar' ? 1 : 3; // 1:1 for avatar, 3:1 for cover
      
      const maxWidth = Math.min(img.naturalWidth, 400);
      const maxHeight = cropType === 'avatar' ? maxWidth : maxWidth / aspectRatio;
      
      setCrop({
        x: (img.naturalWidth - maxWidth) / 2,
        y: (img.naturalHeight - maxHeight) / 2,
        width: maxWidth,
        height: maxHeight
      });
    }
  }, [imageFile, cropType]);

  // ✅ Mouse/Touch handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current || isMobile) return;
    
    // ✅ Use requestAnimationFrame for smooth desktop updates too
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    animationFrame.current = requestAnimationFrame(() => {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(prev.x + deltaX, imageRef.current!.naturalWidth - prev.width)),
        y: Math.max(0, Math.min(prev.y + deltaY, imageRef.current!.naturalHeight - prev.height))
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    });
  }, [isDragging, dragStart, isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ✅ Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (e.touches.length === 1) {
      // Single touch - drag
      setIsDragging(true);
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      setInitialDistance(getTouchDistance(e.touches as any));
      setInitialZoom(zoom);
    }
  }, [isMobile, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !imageRef.current) return;
    
    // ✅ Prevent default to stop scrolling
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Single touch drag - throttle updates
      const deltaX = (e.touches[0].clientX - touchStart.x) * 1.5; // Reduce amplification
      const deltaY = (e.touches[0].clientY - touchStart.y) * 1.5;
      
      // ✅ Use requestAnimationFrame for smooth updates
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      
      animationFrame.current = requestAnimationFrame(() => {
        setCrop(prev => ({
          ...prev,
          x: Math.max(0, Math.min(prev.x + deltaX, imageRef.current!.naturalWidth - prev.width)),
          y: Math.max(0, Math.min(prev.y + deltaY, imageRef.current!.naturalHeight - prev.height))
        }));
        
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      });
    } else if (e.touches.length === 2) {
      // Pinch zoom - throttle updates
      const currentDistance = getTouchDistance(e.touches as any);
      const scale = currentDistance / initialDistance;
      const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
      
      // ✅ Only update if significant change
      if (Math.abs(newZoom - zoom) > 0.05) {
        setZoom(newZoom);
      }
    }
  }, [isMobile, isDragging, touchStart, initialDistance, initialZoom, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getCroppedImage = useCallback(async (): Promise<File> => {
    if (!imageRef.current || !canvasRef.current) {
      throw new Error('Image or canvas not available');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // ✅ Set canvas size based on crop type
    const outputWidth = cropType === 'avatar' ? 400 : 1200;
    const outputHeight = cropType === 'avatar' ? 400 : 400;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // ✅ Apply transformations
    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-outputWidth / 2, -outputHeight / 2);

    // ✅ Draw cropped image
    ctx.drawImage(
      image,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, outputWidth, outputHeight
    );

    ctx.restore();

    // ✅ Convert to File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File(
            [blob], 
            `cropped_${cropType}_${Date.now()}.jpg`, 
            { type: 'image/jpeg' }
          );
          resolve(croppedFile);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [crop, zoom, rotation, cropType]);

  const handleCropConfirm = async () => {
    try {
      const croppedFile = await getCroppedImage();
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  if (!imageFile) return null;

  // ✅ Mobile Layout
  const MobileLayout = () => (
    <DialogContent className="w-full h-screen max-w-none max-h-none m-0 rounded-none p-0 flex flex-col">
      <DialogHeader className="p-4 border-b bg-background/95 backdrop-blur">
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <span className="text-base">Crop {cropType === 'avatar' ? 'Avatar' : 'Cover'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogTitle>
      </DialogHeader>

      {/* Mobile Image Editor - Full Screen */}
      <div className="flex-1 flex flex-col">
        <div 
          className="flex-1 relative bg-gray-900 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }} // ✅ Prevent default touch behaviors
        >
          {imageUrl && (
            <>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="w-full h-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  willChange: 'transform' // ✅ Optimize for animations
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
              
              {/* Mobile Crop Overlay */}
              {imageRef.current && (
                <div 
                  className="absolute border-2 border-white shadow-lg"
                  style={{
                    left: `${(crop.x / imageRef.current.naturalWidth) * 100}%`,
                    top: `${(crop.y / imageRef.current.naturalHeight) * 100}%`,
                    width: `${(crop.width / imageRef.current.naturalWidth) * 100}%`,
                    height: `${(crop.height / imageRef.current.naturalHeight) * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-10" />
                  {/* Corner handles for mobile */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-blue-500" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-blue-500" />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-blue-500" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-blue-500" />
                  {/* Center drag handle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Move className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Controls - Bottom Panel */}
        <div className="bg-background border-t p-4 space-y-4">
          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            📱 Pinch to zoom • Drag to move • Tap corners to resize
          </div>
          
          {/* Quick Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4" />
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="px-3"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="flex-1"
            >
              <Crop className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  // ✅ Desktop Layout  
  const DesktopLayout = () => (
    <DialogContent className="max-w-6xl max-h-[90vh] p-0">
      <DialogHeader className="p-6 pb-0">
        <DialogTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <Crop className="h-5 w-5" />
          Crop {cropType === 'avatar' ? 'Profile Picture' : 'Cover Image'}
        </DialogTitle>
      </DialogHeader>

      <div className="flex gap-6 p-6">
        {/* Desktop Image Editor */}
        <div className="flex-1 space-y-4">
          <div 
            className="relative bg-gray-100 rounded-lg overflow-hidden cursor-move"
            style={{ aspectRatio: cropType === 'avatar' ? '1' : '3/1', minHeight: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragStart={(e) => e.preventDefault()} // ✅ Prevent image drag
          >
            {imageUrl && (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    willChange: 'transform' // ✅ Optimize for animations
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
                
                {/* Desktop Crop Overlay */}
                {imageRef.current && (
                  <div 
                    className="absolute border-2 border-white shadow-lg cursor-move hover:border-blue-400 transition-colors"
                    style={{
                      left: `${(crop.x / imageRef.current.naturalWidth) * 100}%`,
                      top: `${(crop.y / imageRef.current.naturalHeight) * 100}%`,
                      width: `${(crop.width / imageRef.current.naturalWidth) * 100}%`,
                      height: `${(crop.height / imageRef.current.naturalHeight) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white bg-opacity-10" />
                    {/* Desktop resize handles */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-nw-resize" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-ne-resize" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-sw-resize" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-se-resize" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                className="w-40"
              />
              <ZoomIn className="h-4 w-4" />
              <span className="text-sm text-muted-foreground min-w-[3rem]">{Math.round(zoom * 100)}%</span>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate 90°
            </Button>
            
            <div className="text-sm text-muted-foreground">
              💡 Click and drag to reposition
            </div>
          </div>
        </div>

        {/* Desktop Preview Panel */}
        <div className="w-80 space-y-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Preview
            </h3>
            
            <div className="space-y-4">
              {/* Large Preview */}
              <div 
                className="bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
                style={{ 
                  aspectRatio: cropType === 'avatar' ? '1' : '3/1',
                  width: cropType === 'avatar' ? '160px' : '320px'
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover"
                  style={{ display: 'none' }}
                />
                {imageUrl && imageRef.current && (
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundPosition: `${-crop.x}px ${-crop.y}px`,
                      backgroundSize: `${imageRef.current.naturalWidth}px ${imageRef.current.naturalHeight}px`,
                      transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                  />
                )}
              </div>
              
              {/* Small Preview */}
              <div className="flex gap-3">
                <div 
                  className="bg-gray-100 rounded border"
                  style={{ 
                    aspectRatio: cropType === 'avatar' ? '1' : '3/1',
                    width: cropType === 'avatar' ? '40px' : '80px'
                  }}
                >
                  {imageUrl && imageRef.current && (
                    <div 
                      className="w-full h-full bg-cover bg-center rounded"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundPosition: `${-crop.x}px ${-crop.y}px`,
                        backgroundSize: `${imageRef.current.naturalWidth}px ${imageRef.current.naturalHeight}px`,
                        transform: `scale(${zoom}) rotate(${rotation}deg)`
                      }}
                    />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Output:</p>
                  <p>{cropType === 'avatar' ? '400×400px' : '1200×400px'}</p>
                  <p>Ratio: {cropType === 'avatar' ? '1:1' : '3:1'}</p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">💡 Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Drag the image to reposition</li>
                  <li>• Use zoom for perfect framing</li>
                  <li>• Rotate if needed</li>
                  <li>• Preview shows final result</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="p-6 pt-0 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            Output: {cropType === 'avatar' ? '400×400px (1:1)' : '1200×400px (3:1)'}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="min-w-[120px]"
            >
              <Crop className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </Dialog>
  );
};
