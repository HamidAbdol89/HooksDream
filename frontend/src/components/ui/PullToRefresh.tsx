// src/components/ui/PullToRefresh.tsx - Native Pull-to-Refresh Component
import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, ChevronDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  isRefreshing?: boolean;
  threshold?: number;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isRefreshing = false,
  threshold = 80,
  className = ''
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const scale = useTransform(y, [0, threshold], [0.8, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 180]);

  const handlePanStart = useCallback(() => {
    if (containerRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  }, []);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (!isPulling || info.delta.y < 0) return;
    
    const newY = Math.max(0, Math.min(info.offset.y, threshold * 1.5));
    y.set(newY);
    
    setShouldRefresh(newY >= threshold);
  }, [isPulling, threshold, y]);

  const handlePanEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (shouldRefresh && !isRefreshing) {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    }
    
    y.set(0);
    setShouldRefresh(false);
  }, [isPulling, shouldRefresh, isRefreshing, onRefresh, y]);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
        style={{
          y: useTransform(y, [0, threshold], [-60, 20]),
          opacity,
        }}
      >
        <motion.div
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border"
          style={{ scale }}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Refreshing...</span>
            </>
          ) : (
            <>
              <motion.div style={{ rotate }}>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700">
                {shouldRefresh ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
