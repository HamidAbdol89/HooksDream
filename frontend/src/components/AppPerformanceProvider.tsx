// src/components/AppPerformanceProvider.tsx
import React, { useEffect } from 'react';
import { performanceMonitor, performanceUtils } from '@/utils/simplePerformance';

interface AppPerformanceProviderProps {
  children: React.ReactNode;
}

export const AppPerformanceProvider: React.FC<AppPerformanceProviderProps> = ({ children }) => {
  useEffect(() => {
    // Khởi tạo performance monitoring
    console.log('🚀 Starting HooksDream Performance Monitoring');
    
    // Track initial page load
    performanceMonitor.markStart('app-init');
    
    // Check network quality và adjust behavior
    const networkQuality = performanceUtils.getNetworkQuality();
    console.log(`📶 Network Quality: ${networkQuality}`);
    
    // Preload critical resources based on network
    if (networkQuality === 'fast') {
      performanceUtils.preloadResource('/api/posts', 'fetch');
      performanceUtils.preloadResource('/images/avatar-placeholder.webp', 'image');
    }
    
    // Track memory usage immediately
    performanceMonitor.trackMemoryUsage();
    
    // Mark app initialization complete
    setTimeout(() => {
      performanceMonitor.markEnd('app-init');
    }, 100);
    
    return () => {
      console.log('🛑 Performance monitoring stopped');
    };
  }, []);

  return <>{children}</>;
};
