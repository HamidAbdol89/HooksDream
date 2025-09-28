import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'slide-up' | 'fade' | 'slide-right';
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'slide-up',
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mount animation
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  const getTransitionStyles = () => {
    const baseStyles = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      willChange: 'transform, opacity'
    };

    switch (type) {
      case 'slide-up':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          opacity: isVisible ? 1 : 0
        };
      case 'fade':
        return {
          ...baseStyles,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)'
        };
      case 'slide-right':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          opacity: isVisible ? 1 : 0
        };
      default:
        return baseStyles;
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div 
      className={className}
      style={getTransitionStyles()}
    >
      {children}
    </div>
  );
};

// Hook for programmatic page transitions
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = (callback: () => void, delay = 150) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      callback();
      setIsTransitioning(false);
    }, delay);
  };

  return { isTransitioning, startTransition };
};
