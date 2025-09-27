// components/chat/shared/AudioRecorder.tsx - Audio recording component for chat
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useMessageStatus } from '@/hooks/useMessageStatus';

interface AudioRecorderProps {
  conversationId: string;
  onAudioSent: () => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  conversationId,
  onAudioSent,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { token } = useGoogleAuth();
  const { sendAudioMessageWithStatus } = useMessageStatus(conversationId);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedAudio(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioLoad = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const sendAudio = async () => {
    if (!recordedAudio || isUploading) return;

    setIsUploading(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      // Convert blob to file
      const audioFile = new File([recordedAudio], `audio-${Date.now()}.webm`, {
        type: 'audio/webm;codecs=opus'
      });

      const result = await sendAudioMessageWithStatus(
        audioFile,
        duration,
        tempId
      );

      if (result.success) {
        handleCancel();
        onAudioSent();
      } else {
        alert('Gửi tin nhắn âm thanh thất bại');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn âm thanh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    setRecordingTime(0);
    setShowRecorder(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mic button */}
      {!showRecorder && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRecorder(true)}
          disabled={disabled || isUploading}
          className="h-10 w-10 p-0 rounded-full hover:bg-muted/50"
        >
          <Mic className="w-4 h-4" />
        </Button>
      )}

      {/* Recording interface */}
      {showRecorder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                {isRecording ? 'Đang ghi âm...' : recordedAudio ? 'Xem lại ghi âm' : 'Ghi âm tin nhắn'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Recording content */}
            <div className="p-6">
              {/* Recording visualization */}
              <div className="flex flex-col items-center space-y-4">
                {/* Mic icon with animation */}
                <div className={`relative ${isRecording ? 'animate-pulse' : ''}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isRecording ? 'bg-red-500' : 'bg-primary'
                  }`}>
                    {isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  {/* Recording rings */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </div>

                {/* Timer */}
                <div className="text-2xl font-mono font-bold">
                  {formatTime(isRecording ? recordingTime : duration)}
                </div>

                {/* Status text */}
                <p className="text-sm text-muted-foreground text-center">
                  {isRecording 
                    ? 'Nhấn để dừng ghi âm' 
                    : recordedAudio 
                    ? 'Nhấn play để nghe lại'
                    : 'Nhấn để bắt đầu ghi âm'
                  }
                </p>
              </div>

              {/* Hidden audio element for playback */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onLoadedMetadata={handleAudioLoad}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 p-4 pt-0">
              {!recordedAudio && !isRecording && (
                <Button
                  onClick={startRecording}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Bắt đầu ghi
                </Button>
              )}

              {isRecording && (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Dừng ghi
                </Button>
              )}

              {recordedAudio && !isRecording && (
                <>
                  <Button
                    variant="outline"
                    onClick={playRecording}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Tạm dừng
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Phát
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={sendAudio}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
