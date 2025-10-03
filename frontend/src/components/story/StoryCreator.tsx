// StoryCreator.tsx - Clean Professional Story Creation Modal
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Video, Mic, Type, Palette, Sparkles, Settings, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryCreatorProps, CreateStoryData, StoryVisualEffects, STORY_BUBBLE_STYLES } from '@/types/story';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  onCreateStory,
  onClose,
  isOpen
}) => {
  const [step, setStep] = useState<'type' | 'content' | 'effects' | 'settings'>('type');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'text'>('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Visual effects state
  const [visualEffects, setVisualEffects] = useState<StoryVisualEffects>({
    bubbleStyle: 'glass',
    colorTheme: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#06B6D4'
    },
    animation: 'float',
    particles: {
      enabled: true,
      type: 'sparkles',
      intensity: 5
    }
  });

  // Settings state
  const [settings, setSettings] = useState({
    visibility: 'followers' as 'public' | 'followers' | 'close_friends' | 'private',
    allowReplies: true,
    allowReactions: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  // Handle story creation
  const handleCreateStory = useCallback(async () => {
    if (!content && !selectedFile) return;

    setIsLoading(true);
    try {
      const storyData: CreateStoryData = {
        content,
        mediaType,
        media: selectedFile || undefined,
        visualEffects,
        settings,
        position: {
          x: Math.random() * 80 + 10, // 10-90%
          y: Math.random() * 80 + 10,
          z: Math.random() * 8 + 1,
          velocity: { x: 0, y: 0 },
          scale: 0.8 + Math.random() * 0.4
        }
      };

      await onCreateStory(storyData);
      onClose();
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setIsLoading(false);
    }
  }, [content, selectedFile, mediaType, visualEffects, settings, onCreateStory, onClose]);

  // Step navigation
  const nextStep = () => {
    const steps = ['type', 'content', 'effects', 'settings'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = ['type', 'content', 'effects', 'settings'] as const;
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Story
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {['type', 'content', 'effects', 'settings'].indexOf(step) + 1} of 4
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((['type', 'content', 'effects', 'settings'].indexOf(step) + 1) / 4) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Media Type Selection */}
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Choose story type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'text', icon: Type, label: 'Text', desc: 'Share your thoughts' },
                    { type: 'image', icon: Camera, label: 'Photo', desc: 'Upload an image' },
                    { type: 'video', icon: Video, label: 'Video', desc: 'Record or upload' },
                    { type: 'audio', icon: Mic, label: 'Audio', desc: 'Voice message' }
                  ].map(({ type, icon: Icon, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setMediaType(type as any)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        mediaType === type
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <Icon className={cn(
                        "w-6 h-6 mb-2",
                        mediaType === type ? "text-purple-600" : "text-gray-500"
                      )} />
                      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Content Input */}
            {step === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add your content
                </h3>
                
                {mediaType === 'text' && (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                )}

                {mediaType !== 'text' && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        mediaType === 'image' ? 'image/*' :
                        mediaType === 'video' ? 'video/*' :
                        mediaType === 'audio' ? 'audio/*' : '*/*'
                      }
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {!selectedFile ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 transition-colors"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <div className="text-gray-600 dark:text-gray-300">
                          Click to upload {mediaType}
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {mediaType === 'image' && previewUrl && (
                          <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                        )}
                        {mediaType === 'video' && previewUrl && (
                          <video src={previewUrl} className="w-full h-48 object-cover rounded-xl" controls />
                        )}
                        {mediaType === 'audio' && previewUrl && (
                          <audio src={previewUrl} className="w-full" controls />
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </div>
                      </div>
                    )}

                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full h-20 p-3 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Visual Effects */}
            {step === 'effects' && (
              <motion.div
                key="effects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Customize appearance
                </h3>
                
                {/* Bubble Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bubble Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(STORY_BUBBLE_STYLES).map((style) => (
                      <button
                        key={style}
                        onClick={() => setVisualEffects(prev => ({ ...prev, bubbleStyle: style as any }))}
                        className={cn(
                          "p-3 rounded-lg border text-sm capitalize transition-all",
                          visualEffects.bubbleStyle === style
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Theme
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#06B6D4' },
                      { primary: '#EF4444', secondary: '#F97316', accent: '#EAB308' },
                      { primary: '#10B981', secondary: '#06B6D4', accent: '#8B5CF6' },
                      { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B' }
                    ].map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => setVisualEffects(prev => ({ ...prev, colorTheme: theme }))}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 transition-all",
                          JSON.stringify(visualEffects.colorTheme) === JSON.stringify(theme)
                            ? "border-gray-900 dark:border-white scale-110"
                            : "border-gray-300 dark:border-gray-600"
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Settings */}
            {step === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Privacy & Settings
                </h3>
                
                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who can see this story?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'public', label: 'Everyone', desc: 'Anyone can see your story' },
                      { value: 'followers', label: 'Followers', desc: 'Only your followers' },
                      { value: 'close_friends', label: 'Close Friends', desc: 'Selected close friends' },
                      { value: 'private', label: 'Only Me', desc: 'Just for you' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setSettings(prev => ({ ...prev, visibility: value as any }))}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          settings.visibility === value
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interaction Settings */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Interactions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.allowReactions}
                        onChange={(e) => setSettings(prev => ({ ...prev, allowReactions: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Allow reactions</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.allowReplies}
                        onChange={(e) => setSettings(prev => ({ ...prev, allowReplies: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Allow replies</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 'type'}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <div className="flex space-x-2">
            {step !== 'settings' ? (
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateStory}
                disabled={(!content && !selectedFile) || isLoading}
                isLoading={isLoading}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Story</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoryCreator;
