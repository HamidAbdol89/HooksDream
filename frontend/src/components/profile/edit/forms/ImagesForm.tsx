import React, { useRef, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Camera, User, Loader2, Image as ImageIcon, Crop } from 'lucide-react';
import { ProfileFormData } from '@/types/profile';
import { MobileImageCropper } from '@/components/ui/MobileImageCropper';
import { DesktopImageCropper } from '@/components/ui/DesktopImageCropper';
import { useAppStore } from '@/store/useAppStore';

interface ImagesFormProps {
  formData: ProfileFormData;
  imageUploading: 'avatar' | 'cover' | null;
  onImageUpload: (file: File, type: 'avatar' | 'coverImage') => void;
}

export function ImagesForm({ formData, imageUploading, onImageUpload }: ImagesFormProps) {
  const { user: currentUser } = useAppStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  
  // ✅ Crop modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    file: File | null;
    type: 'avatar' | 'cover';
    imageUrl: string;
  }>({ isOpen: false, file: null, type: 'avatar', imageUrl: '' });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  // ✅ Handle file selection for cropping
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create image URL for cropper
    const imageUrl = URL.createObjectURL(file);

    // Open crop modal
    setCropModal({
      isOpen: true,
      file,
      type: type === 'avatar' ? 'avatar' : 'cover',
      imageUrl
    });
  };

  // ✅ Handle crop completion for mobile
  const handleMobileCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File(
      [croppedBlob], 
      `cropped_${cropModal.type}_${Date.now()}.jpg`, 
      { type: 'image/jpeg' }
    );
    
    onImageUpload(croppedFile, cropModal.type === 'avatar' ? 'avatar' : 'coverImage');
    
    // Cleanup
    if (cropModal.imageUrl) {
      URL.revokeObjectURL(cropModal.imageUrl);
    }
    setCropModal({ isOpen: false, file: null, type: 'avatar', imageUrl: '' });
  };

  // ✅ Handle crop completion for desktop
  const handleDesktopCropComplete = (croppedFile: File) => {
    onImageUpload(croppedFile, cropModal.type === 'avatar' ? 'avatar' : 'coverImage');
    
    // Cleanup
    if (cropModal.imageUrl) {
      URL.revokeObjectURL(cropModal.imageUrl);
    }
    setCropModal({ isOpen: false, file: null, type: 'avatar', imageUrl: '' });
  };

  // ✅ Handle crop modal close
  const handleCropClose = () => {
    // Cleanup image URL
    if (cropModal.imageUrl) {
      URL.revokeObjectURL(cropModal.imageUrl);
    }
    
    setCropModal({ isOpen: false, file: null, type: 'avatar', imageUrl: '' });
    
    // Clear file input
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const getImageUrl = (url: string | undefined, type: 'avatar' | 'cover' = 'avatar') => {
    // First try formData URL
    if (url && url.trim()) {
      // Handle different URL formats
      if (url.startsWith('http')) {
        return url;
      }
      
      // Handle relative URLs or cloudinary URLs
      if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
        return url;
      }
      
      // Handle local/relative paths
      if (url.startsWith('/')) {
        return url;
      }
      
      return url;
    }
    
    // Fallback to currentUser data
    if (currentUser) {
      const fallbackUrl = type === 'avatar' ? currentUser.avatar : currentUser.coverImage;
      if (fallbackUrl && fallbackUrl.trim()) {
        return fallbackUrl;
      }
    }
    
    return '';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Picture */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Profile Picture</Label>
        
        <Card className="p-4 sm:p-6">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border">
                  <AvatarImage 
                    src={
                      formData.avatar || 
                      currentUser?.avatar || 
                      (currentUser as any)?.profilePicture ||
                      (currentUser as any)?.picture ||
                      (currentUser as any)?.photo ||
                      getImageUrl(formData.avatar, 'avatar') || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&size=400&background=6366f1&color=ffffff`
                    } 
                    alt="Profile picture" 
                    className="object-cover"
                    key={formData.avatar || currentUser?.avatar || 'placeholder'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <User className="h-8 w-8 sm:h-10 sm:w-10" />
                  </AvatarFallback>
                </Avatar>
                {imageUploading === 'avatar' && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerFileInput(avatarInputRef)}
                    disabled={imageUploading === 'avatar'}
                    className="w-full sm:w-auto"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {(formData.avatar || currentUser?.avatar) ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  
                  {(formData.avatar || currentUser?.avatar) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (avatarInputRef.current) {
                          avatarInputRef.current.value = '';
                        }
                        // Remove avatar by uploading empty file
                        const emptyFile = new File([], 'empty', { type: 'image/jpeg' });
                        onImageUpload(emptyFile, 'avatar');
                      }}
                      disabled={imageUploading === 'avatar'}
                      className="w-full sm:w-auto text-destructive hover:text-destructive/90"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={(e) => handleFileSelect(e, 'avatar')}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                
                <p className="text-sm text-muted-foreground">
                  <Crop className="h-3 w-3 inline mr-1" />
                  Auto-cropped to 1:1 ratio, 400×400px output. Max 10MB.
                  {formData.avatar?.includes('cloudinary.com') && (
                    <span className="block text-green-600 mt-1">
                      ✅ Stored securely on Cloudinary CDN
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cover Image */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Cover Image</Label>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-32 sm:h-40 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
              {(formData.coverImage || currentUser?.coverImage) ? (
                <>
                  <img
                    src={
                      formData.coverImage || 
                      currentUser?.coverImage || 
                      getImageUrl(formData.coverImage, 'cover')
                    }
                    alt="Cover"
                    className="w-full h-full object-cover"
                    key={formData.coverImage || currentUser?.coverImage || 'default'}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => triggerFileInput(coverInputRef)}
                      disabled={imageUploading === 'cover'}
                      className="opacity-0 hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Cover
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => triggerFileInput(coverInputRef)}>
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No cover image</p>
                    <p className="text-xs">Click to upload</p>
                  </div>
                </div>
              )}
              
              {imageUploading === 'cover' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={coverInputRef}
              onChange={(e) => handleFileSelect(e, 'coverImage')}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-muted-foreground flex-1">
                  <Crop className="h-3 w-3 inline mr-1" />
                  Auto-cropped to 3:1 ratio, 1200×400px output. Max 10MB.
                  {formData.coverImage?.includes('cloudinary.com') && (
                    <span className="block text-green-600 mt-1">
                      ✅ Optimized and delivered via CDN
                    </span>
                  )}
                </p>
                
                {(formData.coverImage || currentUser?.coverImage) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (coverInputRef.current) {
                        coverInputRef.current.value = '';
                      }
                      // Remove cover by uploading empty file
                      const emptyFile = new File([], 'empty', { type: 'image/jpeg' });
                      onImageUpload(emptyFile, 'coverImage');
                    }}
                    disabled={imageUploading === 'cover'}
                    className="text-destructive hover:text-destructive/90 text-sm"
                  >
                    Remove Cover
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Mobile vs Desktop Cropper */}
      {cropModal.isOpen && (
        isMobile ? (
          <MobileImageCropper
            imageUrl={cropModal.imageUrl}
            aspectRatio={cropModal.type === 'avatar' ? 1 : 3}
            cropType={cropModal.type}
            onCrop={handleMobileCropComplete}
            onCancel={handleCropClose}
            title={`Crop ${cropModal.type === 'avatar' ? 'Avatar' : 'Cover Image'}`}
          />
        ) : (
          <DesktopImageCropper
            imageUrl={cropModal.imageUrl}
            aspectRatio={cropModal.type === 'avatar' ? 1 : 3}
            cropType={cropModal.type}
            onCrop={handleMobileCropComplete}
            onCancel={handleCropClose}
            title={`Crop ${cropModal.type === 'avatar' ? 'Avatar' : 'Cover Image'}`}
          />
        )
      )}
    </div>
  );
}