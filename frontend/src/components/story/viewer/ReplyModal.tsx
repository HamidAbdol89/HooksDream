// ReplyModal.tsx - Professional Reply Modal with Overlay
import React, { useRef, useEffect } from 'react';
import { useTransition, animated, useSpring } from '@react-spring/web';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReplyInputProps } from './types';

export const ReplyModal: React.FC<ReplyInputProps> = ({
  show,
  message,
  onMessageChange,
  onSubmit,
  onClose
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && message.trim()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent space key from triggering story pause
    if (e.key === ' ') {
      e.stopPropagation();
    }
    // Prevent arrow keys from changing stories
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.stopPropagation();
    }
    // Close modal on Escape
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Auto focus when modal opens
  useEffect(() => {
    if (show && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show]);

  // Modal transition
  const modalTransition = useTransition(show, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 300,
      friction: 30
    }
  });

  // Content slide up animation
  const contentSpring = useSpring({
    transform: show ? 'translateY(0%)' : 'translateY(100%)',
    opacity: show ? 1 : 0,
    config: {
      tension: 400,
      friction: 35,
      mass: 0.8
    }
  });

  return (
    <>
      {modalTransition((style, item) =>
        item ? (
          <>
            {/* Backdrop */}
            <animated.div
              style={{ opacity: style.opacity }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />
            
            {/* Modal Content */}
            <animated.div
              style={contentSpring}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Reply to story
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Input Section */}
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    onKeyPress={handleKeyPress}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    onClick={onSubmit}
                    disabled={!message.trim()}
                    size="sm"
                    className="px-4 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
            
              </div>
            </animated.div>
          </>
        ) : null
      )}
    </>
  );
};
