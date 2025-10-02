import React from 'react';
import { ClipLoader } from 'react-spinners';
import { cn } from '../../utils/helpers';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'white' | 'primary';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  color = 'default'
}) => {
  const sizeMap = {
    sm: 16,
    md: 32,
    lg: 48
  };

  const colorMap = {
    default: '#8b5cf6',
    white: '#ffffff',
    primary: 'hsl(var(--primary))'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <ClipLoader
        color={colorMap[color]}
        size={sizeMap[size]}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  );
};
