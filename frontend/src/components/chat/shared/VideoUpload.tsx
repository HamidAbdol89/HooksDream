// components/chat/shared/VideoUpload.tsx - Video upload component for chat
import React, { useRef, useState } from 'react';
import { Video, X, Send, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useMessageStatus } from '@/hooks/useMessageStatus';

interface VideoUploadProps {
  conversationId: string;
  onVideoSent: () => void;
  disabled?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  conversationId,
  onVideoSent,
  disabled = false
}) => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { token } = useGoogleAuth();
  const { sendVideoMessageWithStatus } = useMessageStatus(conversationId);

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn file video');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('Kích thước video không được vượt quá 100MB');
      return;
    }

    setSelectedVideo(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSendVideo = async () => {
    if (!selectedVideo || isUploading) return;

    setIsUploading(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      const result = await sendVideoMessageWithStatus(
        selectedVideo,
        caption.trim() || undefined,
        duration,
        tempId
      );

      if (result.success) {
        // Reset form
        setSelectedVideo(null);
        setVideoPreview(null);
        setCaption('');
        setDuration(0);
        setIsPlaying(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onVideoSent();
      } else {
        alert('Gửi video thất bại');
      }
    } catch (error) {
      console.error('Error sending video:', error);
      alert('Có lỗi xảy ra khi gửi video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setCaption('');
    setDuration(0);
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Video upload button */}
      {!selectedVideo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="h-10 w-10 p-0 rounded-full hover:bg-muted/50"
        >
          <Video className="w-4 h-4" />
        </Button>
      )}

      {/* Video preview modal */}
      {selectedVideo && videoPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Gửi video</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video preview */}
            <div className="p-4">
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-auto max-h-60 object-contain"
                  onLoadedMetadata={handleVideoLoad}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* Play/Pause overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={togglePlay}
                    className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Duration indicator */}
                {duration > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(duration)}
                  </div>
                )}
              </div>
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
                onClick={handleSendVideo}
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
