// hooks/useVirtualScroll.ts - High-Performance Virtual Scrolling như TikTok/Instagram
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface VirtualScrollItem {
  id: string;
  height?: number;
  data: any;
}

interface VirtualScrollOptions {
  itemHeight?: number; // Default item height
  overscan?: number; // Extra items to render outside viewport
  scrollElement?: HTMLElement | null; // Custom scroll container
  estimatedItemHeight?: number; // For dynamic heights
  getItemHeight?: (index: number, item: any) => number; // Dynamic height function
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    item: any;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  isScrolling: boolean;
  visibleRange: { start: number; end: number };
}

export const useVirtualScroll = (
  items: VirtualScrollItem[],
  options: VirtualScrollOptions = {}
): VirtualScrollResult => {
  const {
    itemHeight = 400, // Default post height
    overscan = 5,
    scrollElement,
    estimatedItemHeight = 400,
    getItemHeight
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const measurementCache = useRef<Map<string, number>>(new Map());

  // Get scroll container
  const getScrollElement = useCallback(() => {
    return scrollElement || scrollElementRef.current || window;
  }, [scrollElement]);

  // Measure viewport height
  useEffect(() => {
    const updateViewportHeight = () => {
      const element = getScrollElement();
      if (element === window) {
        setViewportHeight(window.innerHeight);
      } else if (element && element instanceof HTMLElement) {
        setViewportHeight(element.clientHeight);
      }
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, [getScrollElement]);

  // Handle scroll events with throttling
  useEffect(() => {
    const element = getScrollElement();
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element === window 
        ? window.scrollY 
        : (element as HTMLElement).scrollTop;
      
      setScrollTop(scrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    // Use passive listener for better performance
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [getScrollElement]);

  // Calculate item height with caching
  const getCalculatedItemHeight = useCallback((index: number, item: any): number => {
    const cacheKey = `${item.id}-${index}`;
    
    // Check cache first
    if (measurementCache.current.has(cacheKey)) {
      return measurementCache.current.get(cacheKey)!;
    }

    let height: number;

    if (getItemHeight) {
      height = getItemHeight(index, item);
    } else if (itemHeights.has(index)) {
      height = itemHeights.get(index)!;
    } else {
      // Estimate height based on content
      height = estimatePostHeight(item);
    }

    // Cache the result
    measurementCache.current.set(cacheKey, height);
    return height;
  }, [getItemHeight, itemHeights, estimatedItemHeight]);

  // Smart height estimation for posts
  const estimatePostHeight = useCallback((post: any): number => {
    let baseHeight = 200; // Base post height (header + actions)
    
    // Add height for content
    if (post.content) {
      const lines = Math.ceil(post.content.length / 50); // Rough estimate
      baseHeight += Math.min(lines * 20, 120); // Max 6 lines
    }
    
    // Add height for images
    if (post.images && post.images.length > 0) {
      if (post.images.length === 1) {
        baseHeight += 400; // Single image
      } else if (post.images.length <= 4) {
        baseHeight += 300; // Grid layout
      } else {
        baseHeight += 350; // Grid with "more" indicator
      }
    }
    
    // Add height for video
    if (post.video) {
      baseHeight += 400;
    }
    
    return baseHeight;
  }, []);

  // Calculate visible range and virtual items
  const { virtualItems, totalHeight, visibleRange } = useMemo(() => {
    if (!items.length || !viewportHeight) {
      return {
        virtualItems: [],
        totalHeight: 0,
        visibleRange: { start: 0, end: 0 }
      };
    }

    const scrollStart = scrollTop;
    const scrollEnd = scrollTop + viewportHeight;

    let currentOffset = 0;
    let startIndex = 0;
    let endIndex = 0;
    let foundStart = false;

    // Find visible range
    for (let i = 0; i < items.length; i++) {
      const height = getCalculatedItemHeight(i, items[i]);
      const itemStart = currentOffset;
      const itemEnd = currentOffset + height;

      if (!foundStart && itemEnd >= scrollStart - overscan * estimatedItemHeight) {
        startIndex = Math.max(0, i - overscan);
        foundStart = true;
      }

      if (foundStart && itemStart > scrollEnd + overscan * estimatedItemHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }

      currentOffset += height;
    }

    if (!foundStart) {
      startIndex = 0;
    }
    
    if (endIndex === 0) {
      endIndex = Math.min(items.length - 1, startIndex + Math.ceil(viewportHeight / estimatedItemHeight) + overscan * 2);
    }

    // Generate virtual items
    const virtualItems = [];
    let offset = 0;

    // Calculate offset to start index
    for (let i = 0; i < startIndex; i++) {
      offset += getCalculatedItemHeight(i, items[i]);
    }

    // Generate visible items
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const height = getCalculatedItemHeight(i, items[i]);
      
      virtualItems.push({
        index: i,
        start: offset,
        end: offset + height,
        item: items[i]
      });
      
      offset += height;
    }

    // Calculate total height
    let totalHeight = 0;
    for (let i = 0; i < items.length; i++) {
      totalHeight += getCalculatedItemHeight(i, items[i]);
    }

    return {
      virtualItems,
      totalHeight,
      visibleRange: { start: startIndex, end: endIndex }
    };
  }, [items, scrollTop, viewportHeight, overscan, getCalculatedItemHeight, estimatedItemHeight]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (index < 0 || index >= items.length) return;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getCalculatedItemHeight(i, items[i]);
    }

    const itemHeight = getCalculatedItemHeight(index, items[index]);
    
    let scrollTo = offset;
    if (align === 'center') {
      scrollTo = offset - (viewportHeight - itemHeight) / 2;
    } else if (align === 'end') {
      scrollTo = offset - viewportHeight + itemHeight;
    }

    const element = getScrollElement();
    if (element === window) {
      window.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
    } else if (element) {
      (element as HTMLElement).scrollTop = Math.max(0, scrollTo);
    }
  }, [items, getCalculatedItemHeight, viewportHeight, getScrollElement]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    const element = getScrollElement();
    if (element === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (element) {
      (element as HTMLElement).scrollTop = 0;
    }
  }, [getScrollElement]);

  // Update item height when measured
  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    isScrolling,
    visibleRange
  };
};
