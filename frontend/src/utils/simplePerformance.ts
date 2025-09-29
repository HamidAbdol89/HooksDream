// src/utils/simplePerformance.ts
import React from 'react';

interface PerformanceMetrics {
  renderTime: number | null;
  interactionTime: number | null;
  memoryUsage: number | null;
}

class SimplePerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: null,
    interactionTime: null,
    memoryUsage: null,
  };

  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor() {
    this.initializePerformanceTracking();
  }

  private initializePerformanceTracking() {
    // Track memory usage periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.trackMemoryUsage();
      }, 30000); // Every 30 seconds
    }
  }

  private logMetric(name: string, value: number, unit: string = 'ms') {
    // Disabled in production for performance
    if (process.env.NODE_ENV === 'development') {
      const rating = this.getRating(name, value);
      const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
      
      console.log(`${color} ${name}: ${value.toFixed(2)}${unit} (${rating})`);
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      renderTime: { good: 16, poor: 50 },
      interactionTime: { good: 100, poor: 300 },
      memoryUsage: { good: 50, poor: 100 },
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.metrics));
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Track custom performance marks
  public markStart(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  public markEnd(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  }

  // Track component render times
  public trackComponentRender(componentName: string, renderTime: number) {
    this.metrics.renderTime = renderTime;
    this.notifyListeners();
    
    if (renderTime > 16 && process.env.NODE_ENV === 'development') { // More than one frame (60fps)
      console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    this.logMetric(`${componentName}-render`, renderTime);
  }

  // Track API call performance
  public trackAPICall(endpoint: string, duration: number, success: boolean) {
    if (process.env.NODE_ENV === 'development') {
      const status = success ? '✅' : '❌';
      console.log(`${status} API ${endpoint}: ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  // Memory usage tracking
  public trackMemoryUsage() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      this.metrics.memoryUsage = usedMB;
      this.notifyListeners();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧠 Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
        
        if (usedMB > limitMB * 0.8) {
          console.warn('⚠️ High memory usage detected');
        }
      }
    }
  }

  // Track user interactions
  public trackInteraction(interactionType: string, duration: number) {
    this.metrics.interactionTime = duration;
    this.notifyListeners();
    
    this.logMetric(`interaction-${interactionType}`, duration);
  }
}

// Create singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();

// React hook for using performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(() => 
    performanceMonitor.getMetrics()
  );

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  return metrics;
}

// Higher-order component for tracking component performance
export function withPerformanceTracking<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const MemoizedComponent = React.memo((props: P) => {
    const renderStartTime = React.useRef<number>();

    React.useLayoutEffect(() => {
      renderStartTime.current = performance.now();
    });

    React.useLayoutEffect(() => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        performanceMonitor.trackComponentRender(componentName, renderTime);
      }
    });

    return React.createElement(WrappedComponent, props);
  });

  MemoizedComponent.displayName = `withPerformanceTracking(${componentName})`;
  
  return MemoizedComponent;
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function for expensive operations
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for frequent events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check network connection quality
  getNetworkQuality(): 'slow' | 'fast' | 'unknown' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'slow';
      }
      if (connection.effectiveType === '4g') {
        return 'fast';
      }
    }
    return 'unknown';
  },

  // Preload critical resources
  preloadResource(href: string, as: string, type?: string) {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  },

  // Lazy load non-critical resources
  lazyLoadResource(href: string, as: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = as;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  },
};

export default performanceMonitor;
