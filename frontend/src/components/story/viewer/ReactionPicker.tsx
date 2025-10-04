// ReactionPicker.tsx - Reaction selection component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REACTION_TYPES } from '@/types/story';
import { ReactionPickerProps } from './types';

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  show,
  onReactionClick
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={cn(
            "absolute inset-x-0 bottom-16 sm:bottom-20 md:bottom-30 z-30",
            "flex justify-center",
            "bg-black/80 backdrop-blur-sm rounded-full",
            "w-full max-w-[99%] sm:max-w-md mx-auto",
            "overflow-x-auto no-scrollbar"
          )}
        >
          <div className="flex space-x-2 max-w-[90%] sm:max-w-md p-2">
            {REACTION_TYPES.map((reaction: any) => (
              <button
                key={reaction.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onReactionClick(reaction.type, e);
                }}
                className="p-3 hover:bg-white/20 rounded-full transition-colors text-2xl flex-shrink-0"
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
