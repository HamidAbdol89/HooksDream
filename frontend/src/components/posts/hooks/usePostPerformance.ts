// src/components/posts/hooks/usePostPerformance.ts
import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/utils/simplePerformance';

interface UsePostPerformanceOptions {
  componentName: string;
  trackRender?: boolean;
  trackInteractions?: boolean;
}

export function usePostPerformance({
  componentName,
  trackRender = true,
  trackInteractions = true,
}: UsePostPerformanceOptions) {
  const renderStartTime = useRef<number>();
  const interactionStartTime = useRef<number>();

  // Track component render performance
  useEffect(() => {
    if (trackRender) {
      renderStartTime.current = performance.now();
      
      return () => {
        if (renderStartTime.current) {
          const renderTime = performance.now() - renderStartTime.current;
          performanceMonitor.trackComponentRender(componentName, renderTime);
        }
      };
    }
  });

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string) => {
    if (trackInteractions) {
      interactionStartTime.current = performance.now();
      performanceMonitor.markStart(`${componentName}-${interactionType}`);
      
      return () => {
        if (interactionStartTime.current) {
          performanceMonitor.markEnd(`${componentName}-${interactionType}`);
        }
      };
    }
    return () => {};
  }, [componentName, trackInteractions]);

  // Track image loading performance
  const trackImageLoad = useCallback((imageIndex: number, loadTime: number) => {
    console.log(`📸 Image ${imageIndex} in ${componentName}: ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 2000) {
      console.warn(`⚠️ Slow image load: Image ${imageIndex} took ${loadTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  // Track video loading performance
  const trackVideoLoad = useCallback((loadTime: number) => {
    console.log(`🎥 Video in ${componentName}: ${loadTime.toFixed(2)}ms`);
    
    if (loadTime > 3000) {
      console.warn(`⚠️ Slow video load: Video took ${loadTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  return {
    trackInteraction,
    trackImageLoad,
    trackVideoLoad,
  };
}
