// utils/performanceOptimizer.ts - Production Performance Optimizer
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private isProduction = process.env.NODE_ENV === 'production';

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Safe console logging - only in development
  public log(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.log(message, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.warn(message, ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    // Always log errors, even in production
    console.error(message, ...args);
  }

  // Performance measurement wrapper
  public measurePerformance<T>(
    name: string, 
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    if (this.isProduction) {
      return fn();
    }

    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        this.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      });
    } else {
      const end = performance.now();
      this.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
  }

  // Memory usage tracking
  public trackMemoryUsage(label?: string): void {
    if (this.isProduction || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    
    this.log(`🧠 Memory${label ? ` (${label})` : ''}: ${used}MB / ${total}MB`);
    
    if (used > 100) {
      this.warn(`⚠️ High memory usage: ${used}MB`);
    }
  }

  // Bundle size analyzer
  public analyzeBundleSize(): void {
    if (this.isProduction) return;

    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('assets')) {
        this.log(`📦 Script: ${src}`);
      }
    });
  }

  // React render performance
  public trackRenderPerformance(componentName: string, renderCount: number): void {
    if (this.isProduction) return;

    if (renderCount > 10) {
      this.warn(`🔄 ${componentName} rendered ${renderCount} times - potential performance issue`);
    }
  }

  // Network performance
  public trackNetworkRequest(url: string, duration: number, success: boolean): void {
    if (this.isProduction) return;

    const status = success ? '✅' : '❌';
    this.log(`${status} ${url}: ${duration.toFixed(2)}ms`);
    
    if (duration > 2000) {
      this.warn(`🐌 Slow network request: ${url} took ${duration.toFixed(2)}ms`);
    }
  }

  // Virtual scrolling performance
  public trackVirtualScrolling(visibleItems: number, totalItems: number): void {
    if (this.isProduction) return;

    const efficiency = ((totalItems - visibleItems) / totalItems * 100).toFixed(1);
    this.log(`📜 Virtual Scroll: ${visibleItems}/${totalItems} (${efficiency}% saved)`);
  }

  // Cache hit rate tracking
  public trackCacheHitRate(hits: number, total: number): void {
    if (this.isProduction) return;

    const hitRate = (hits / total * 100).toFixed(1);
    const emoji = parseFloat(hitRate) > 80 ? '🎯' : parseFloat(hitRate) > 60 ? '📊' : '📉';
    this.log(`${emoji} Cache Hit Rate: ${hitRate}% (${hits}/${total})`);
  }

  // Performance summary
  public generatePerformanceSummary(): void {
    if (this.isProduction) return;

    this.log('📊 Performance Summary:');
    this.trackMemoryUsage('Final');
    
    // Check for performance entries
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.log(`⚡ Page Load: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
      this.log(`🎨 DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.fetchStart}ms`);
    }
  }
}

// Export singleton instance
export const perfOptimizer = PerformanceOptimizer.getInstance();
