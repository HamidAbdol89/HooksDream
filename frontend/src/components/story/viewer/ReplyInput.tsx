// ReplyInput.tsx - Smooth reply input with React Spring
import React from 'react';
import { useTransition, animated, useSpring } from '@react-spring/web';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReplyInputProps } from './types';

export const ReplyInput: React.FC<ReplyInputProps> = ({
  show,
  message,
  onMessageChange,
  onSubmit,
  onClose
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  // Smooth slide up animation
  const replyTransition = useTransition(show, {
    from: { transform: 'translateY(100%)', opacity: 0 },
    enter: { transform: 'translateY(0%)', opacity: 1 },
    leave: { transform: 'translateY(100%)', opacity: 0 },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8
    }
  });

  // Input focus animation
  const inputSpring = useSpring({
    scale: show ? 1 : 0.95,
    config: {
      tension: 400,
      friction: 25
    }
  });

  return (
    <>
      {replyTransition((style, item) =>
        item ? (
          <animated.div
            style={style}
            className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-4 z-30"
          >
            <div className="flex items-center space-x-3">
              <animated.input
                style={inputSpring}
                type="text"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Reply to story..."
                className="flex-1 bg-white/20 text-white placeholder-white/70 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 focus:scale-105"
                autoFocus
                onKeyPress={handleKeyPress}
              />
              <Button
                onClick={onSubmit}
                disabled={!message.trim()}
                size="sm"
                className="px-6 hover:scale-105 active:scale-95 transition-transform"
              >
                Send
              </Button>
              <button
                onClick={onClose}
                className="p-3 text-white/70 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </animated.div>
        ) : null
      )}
    </>
  );
};
