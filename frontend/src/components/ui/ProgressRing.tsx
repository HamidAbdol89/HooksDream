import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  showPercentage = false,
  className
}) => {
  const sizes = {
    sm: { ring: 20, stroke: 2, text: 'text-xs' },
    md: { ring: 24, stroke: 2.5, text: 'text-sm' },
    lg: { ring: 32, stroke: 3, text: 'text-base' }
  };

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={ring}
        height={ring}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-500 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center font-medium text-gray-700 dark:text-gray-300',
            text
          )}
        >
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};
