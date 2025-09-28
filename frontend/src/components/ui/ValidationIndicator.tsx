import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationIndicatorProps {
  status: 'valid' | 'invalid' | 'pending' | 'idle';
  message?: string;
  className?: string;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  status,
  message,
  className
}) => {
  const getIcon = () => {
    switch (status) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'invalid':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      default:
        return 'opacity-0';
    }
  };

  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 animate-scale-in',
        getStyles(),
        className
      )}
    >
      {getIcon()}
      {message && <span className="font-medium">{message}</span>}
    </div>
  );
};
