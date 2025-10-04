// ReactionPicker.tsx - Smooth reaction selection with React Spring
import React from 'react';
import { useSpring, animated, useTransition } from '@react-spring/web';
import { cn } from '@/lib/utils';
import { REACTION_TYPES } from '@/types/story';
import { ReactionPickerProps } from './types';

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  show,
  onReactionClick
}) => {
  // Smooth spring animation for picker container
  const pickerTransition = useTransition(show, {
    from: { scale: 0, opacity: 0, transform: 'translateY(20px)' },
    enter: { scale: 1, opacity: 1, transform: 'translateY(0px)' },
    leave: { scale: 0, opacity: 0, transform: 'translateY(20px)' },
    config: {
      tension: 400,
      friction: 30,
      mass: 0.8
    }
  });

  // Staggered animation for reaction buttons
  const buttonTransitions = useTransition(show ? REACTION_TYPES : [], {
    from: { scale: 0, opacity: 0, transform: 'rotate(180deg)' },
    enter: (item, index) => async (next) => {
      await new Promise(resolve => setTimeout(resolve, index * 50)); // Stagger delay
      await next({ scale: 1, opacity: 1, transform: 'rotate(0deg)' });
    },
    leave: { scale: 0, opacity: 0, transform: 'rotate(-180deg)' },
    config: {
      tension: 500,
      friction: 25,
      mass: 0.5
    }
  });

  return (
    <>
      {pickerTransition((style, item) =>
        item ? (
          <animated.div
            style={style}
            className={cn(
              "absolute inset-x-0 bottom-16 sm:bottom-20 md:bottom-30 z-30",
              "flex justify-center",
              "bg-black/80 backdrop-blur-sm rounded-full",
              "w-full max-w-[99%] sm:max-w-md mx-auto",
              "overflow-x-auto no-scrollbar"
            )}
          >
            <div className="flex space-x-2 max-w-[90%] sm:max-w-md p-2">
              {buttonTransitions((buttonStyle, reaction) => (
                <animated.button
                  key={reaction.type}
                  style={buttonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactionClick(reaction.type, e);
                  }}
                  className="p-3 hover:bg-white/20 rounded-full transition-colors text-2xl flex-shrink-0 hover:scale-110 active:scale-95"
                >
                  {reaction.emoji}
                </animated.button>
              ))}
            </div>
          </animated.div>
        ) : null
      )}
    </>
  );
};
