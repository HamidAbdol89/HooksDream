// hooks/useScrollRestoration.ts - Restore scroll position for better UX
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

// Global scroll position cache
const scrollCache = new Map<string, ScrollPosition>();

export const useScrollRestoration = (key?: string) => {
  const location = useLocation();
  const scrollKey = key || location.pathname;
  const isRestoringRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    if (isRestoringRef.current) return;

    const scrollPosition: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    };

    scrollCache.set(scrollKey, scrollPosition);
  }, [scrollKey]);

  // Debounced save to avoid excessive updates
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(saveScrollPosition, 100);
  }, [saveScrollPosition]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    const savedPosition = scrollCache.get(scrollKey);
    
    if (savedPosition) {
      // Check if position is not too old (5 minutes)
      const isPositionValid = Date.now() - savedPosition.timestamp < 5 * 60 * 1000;
      
      if (isPositionValid) {
        isRestoringRef.current = true;
        
        // Use requestAnimationFrame for smooth restoration
        requestAnimationFrame(() => {
          window.scrollTo({
            left: savedPosition.x,
            top: savedPosition.y,
            behavior: 'instant' // Instant for better UX
          });
          
          // Reset flag after a short delay
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        });
        
        return true;
      }
    }
    
    return false;
  }, [scrollKey]);

  // Clear old scroll positions (cleanup)
  const clearOldPositions = useCallback(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, position] of scrollCache.entries()) {
      if (now - position.timestamp > maxAge) {
        scrollCache.delete(key);
      }
    }
  }, []);

  // Setup scroll listener on mount
  useEffect(() => {
    // Add scroll listener
    window.addEventListener('scroll', debouncedSave, { passive: true });
    
    // Add beforeunload listener to save position
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup old positions periodically
    const cleanupInterval = setInterval(clearOldPositions, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      window.removeEventListener('scroll', debouncedSave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(cleanupInterval);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedSave, saveScrollPosition, clearOldPositions]);

  return {
    restoreScrollPosition,
    saveScrollPosition,
    clearScrollPosition: () => scrollCache.delete(scrollKey),
    hasScrollPosition: () => scrollCache.has(scrollKey)
  };
};

// Hook specifically for Feed page with enhanced features
export const useFeedScrollRestoration = () => {
  const { restoreScrollPosition, saveScrollPosition, hasScrollPosition } = useScrollRestoration('/');
  const hasRestoredRef = useRef(false);

  // Enhanced restore for Feed with data dependency
  const restoreFeedScroll = useCallback((hasData: boolean = false) => {
    if (hasRestoredRef.current) return false;

    // Only restore if we have data to avoid scrolling to empty content
    if (hasData && hasScrollPosition()) {
      const restored = restoreScrollPosition();
      if (restored) {
        hasRestoredRef.current = true;
      }
      return restored;
    }

    return false;
  }, [restoreScrollPosition, hasScrollPosition]);

  // Reset restoration flag when leaving page
  useEffect(() => {
    return () => {
      hasRestoredRef.current = false;
    };
  }, []);

  return {
    restoreFeedScroll,
    saveScrollPosition,
    hasScrollPosition: hasScrollPosition()
  };
};
