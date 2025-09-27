// components/chat/shared/ImageUpload.tsx - Image upload component for chat
import React, { useRef, useState } from 'react';
import { Image, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useMessageStatus } from '@/hooks/useMessageStatus';

interface ImageUploadProps {
  conversationId: string;
  onImageSent: () => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  conversationId,
  onImageSent,
  disabled = false
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useGoogleAuth();
  const { sendImageMessageWithStatus } = useMessageStatus(conversationId);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 10MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!selectedImage || isUploading) return;

    setIsUploading(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      const result = await sendImageMessageWithStatus(
        selectedImage,
        caption.trim() || undefined,
        tempId
      );

      if (result.success) {
        // Reset form
        setSelectedImage(null);
        setImagePreview(null);
        setCaption('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onImageSent();
      } else {
        alert('Gửi ảnh thất bại');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Có lỗi xảy ra khi gửi ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image upload button */}
      {!selectedImage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="h-10 w-10 p-0 rounded-full hover:bg-muted/50"
        >
          <Image className="w-4 h-4" />
        </Button>
      )}

      {/* Image preview modal */}
      {selectedImage && imagePreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Gửi ảnh</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Image preview */}
            <div className="p-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-60 object-cover rounded-xl"
              />
            </div>

            {/* Caption input */}
            <div className="p-4 pt-0">
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Thêm chú thích..."
                className="w-full"
                disabled={isUploading}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 p-4 pt-0">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSendImage}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
