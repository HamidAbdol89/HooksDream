import { useState, useEffect, useRef } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll distance to trigger hide/show
  initialVisible?: boolean;
}

export const useScrollDirection = (options: UseScrollDirectionOptions = {}) => {
  const { threshold = 10, initialVisible = true } = options;
  
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Don't hide if we're at the very top
      if (scrollY < threshold) {
        setIsVisible(true);
        setScrollDirection(null);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const difference = scrollY - lastScrollY.current;
      
      // Only update if scroll difference is significant
      if (Math.abs(difference) < threshold) {
        ticking.current = false;
        return;
      }

      if (difference > 0) {
        // Scrolling down
        setScrollDirection('down');
        setIsVisible(false);
      } else {
        // Scrolling up
        setScrollDirection('up');
        setIsVisible(true);
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return {
    isVisible,
    scrollDirection
  };
};
