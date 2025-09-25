import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Camera, User, Loader2, Image as ImageIcon } from 'lucide-react';

// Local types aligned with useAppStore
type ProfileFormData = {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  pronouns?: string;
};

interface ImagesFormProps {
  formData: ProfileFormData;
  imageUploading: 'avatar' | 'cover' | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => void;
}

export function ImagesForm({ formData, imageUploading, onImageUpload }: ImagesFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const getImageUrl = (url: string | undefined) => {
    return url || '';
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
                    src={getImageUrl(formData.avatar) || '/default-avatar.png'} 
                    alt="Profile picture" 
                    className="object-cover"
                    key={formData.avatar}
                  />
                  <AvatarFallback>
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
                    {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  
                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (avatarInputRef.current) {
                          avatarInputRef.current.value = '';
                        }
                        const event = {
                          target: {
                            name: 'avatar',
                            value: null
                          }
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        onImageUpload(event, 'avatar');
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
                  onChange={(e) => onImageUpload(e, 'avatar')}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                
                <p className="text-sm text-muted-foreground">
                  Square image recommended, at least 400×400px. Max 10MB.
                  {formData.avatar?.includes('cloudinary.com') && (
                    <span className="block text-green-600 mt-1">
                      Stored securely on Cloudinary CDN
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
              {formData.coverImage ? (
                <>
                  <img
                    src={getImageUrl(formData.coverImage)}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    key={formData.coverImage}
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
              onChange={(e) => onImageUpload(e, 'coverImage')}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-muted-foreground flex-1">
                  Recommended: 1200×400px or larger. Max 10MB.
                  {formData.coverImage?.includes('cloudinary.com') && (
                    <span className="block text-green-600 mt-1">
                      Optimized and delivered via CDN
                    </span>
                  )}
                </p>
                
                {formData.coverImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (coverInputRef.current) {
                        coverInputRef.current.value = '';
                      }
                      const event = {
                        target: {
                          name: 'coverImage',
                          value: null
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      onImageUpload(event, 'coverImage');
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
    </div>
  );
}