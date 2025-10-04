// ReplyInput.tsx - Reply input modal component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-4 z-30"
        >
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Reply to story..."
              className="flex-1 bg-white/20 text-white placeholder-white/70 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
              onKeyPress={handleKeyPress}
            />
            <Button
              onClick={onSubmit}
              disabled={!message.trim()}
              size="sm"
              className="px-6"
            >
              Send
            </Button>
            <button
              onClick={onClose}
              className="p-3 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
