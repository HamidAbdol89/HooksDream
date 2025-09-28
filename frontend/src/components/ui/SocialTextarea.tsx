import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  characterCount?: {
    current: number;
    max: number;
  };
}

export const SocialTextarea: React.FC<SocialTextareaProps> = ({
  label,
  error,
  icon,
  characterCount,
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-600">{icon}</div>}
          <label className="text-sm font-medium text-gray-900">{label}</label>
          {props.required && <span className="text-red-500 text-sm">*</span>}
        </div>
      )}
      
      <div className="relative">
        <textarea
          className={cn(
            "w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400",
            error && "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20",
            isFocused && !error && "ring-2 ring-blue-500 bg-white dark:bg-gray-700 shadow-sm",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </div>

      <div className="flex items-center justify-between">
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {error}
          </p>
        )}
        
        {characterCount && (
          <p className={cn(
            "text-xs ml-auto",
            characterCount.current > characterCount.max * 0.9 
              ? "text-amber-600" 
              : characterCount.current === characterCount.max 
              ? "text-red-600" 
              : "text-gray-500"
          )}>
            {characterCount.current}/{characterCount.max}
          </p>
        )}
      </div>
    </div>
  );
};
