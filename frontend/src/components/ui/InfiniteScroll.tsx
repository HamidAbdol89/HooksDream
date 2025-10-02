// src/components/ui/InfiniteScroll.tsx - Optimized Infinite Scroll Component
import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  className = '',
  loadingComponent,
  endMessage
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  const defaultLoadingComponent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-8"
    >
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading more...</span>
      </div>
    </motion.div>
  );

  const defaultEndMessage = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <div className="text-gray-400 text-sm">
        🎉 You've reached the end!
      </div>
    </motion.div>
  );

  return (
    <div className={className}>
      {children}
      
      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="h-1" />
      
      {/* Loading state */}
      {isLoading && (loadingComponent || defaultLoadingComponent)}
      
      {/* End message */}
      {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
    </div>
  );
};

export default InfiniteScroll;
