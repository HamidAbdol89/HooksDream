// src/hooks/useAppPerformance.ts
import { useEffect } from 'react';
import { performanceMonitor, usePerformanceMetrics } from '@/utils/simplePerformance';

export function useAppPerformance() {
  const metrics = usePerformanceMetrics();

  useEffect(() => {
    // Bắt đầu theo dõi performance khi app khởi động
    console.log('🚀 Performance monitoring started');
    
    // Track memory usage ngay lập tức
    performanceMonitor.trackMemoryUsage();
    
    // Log performance metrics khi có thay đổi
    if (metrics.renderTime !== null) {
      console.log('📊 Current Performance Metrics:', metrics);
    }
  }, [metrics]);

  return {
    metrics,
    trackInteraction: performanceMonitor.trackInteraction.bind(performanceMonitor),
    trackAPICall: performanceMonitor.trackAPICall.bind(performanceMonitor),
    markStart: performanceMonitor.markStart.bind(performanceMonitor),
    markEnd: performanceMonitor.markEnd.bind(performanceMonitor),
  };
}
