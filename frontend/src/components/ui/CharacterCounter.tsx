import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  className
}) => {
  const percentage = (current / max) * 100;
  
  const getColor = () => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 90) return 'text-amber-600 dark:text-amber-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getBackgroundColor = () => {
    if (percentage >= 100) return 'bg-red-100 dark:bg-red-900/20';
    if (percentage >= 90) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-transparent';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Progress ring for visual feedback */}
      <div className="relative">
        <svg width="16" height="16" className="transform -rotate-90">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray={`${percentage * 0.377} 37.7`}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300',
              percentage >= 100 ? 'text-red-500' :
              percentage >= 90 ? 'text-amber-500' :
              percentage >= 75 ? 'text-blue-500' : 'text-gray-400'
            )}
          />
        </svg>
      </div>
      
      {/* Counter text */}
      <span
        className={cn(
          'text-xs font-medium px-2 py-1 rounded-md transition-all duration-200',
          getColor(),
          getBackgroundColor()
        )}
      >
        {current}/{max}
      </span>
    </div>
  );
};
