// src/hooks/useIsMobile.ts
import { useState, useEffect, useCallback } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const handleResize = useCallback(() => {
    const newIsMobile = window.innerWidth < 768;
    setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev); // Only update if changed
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100); // Debounce 100ms
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  return isMobile;
};