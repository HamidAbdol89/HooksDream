// src/components/posts/PerformanceWrapper.tsx
import React, { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils/simplePerformance';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  componentName: string;
  trackRender?: boolean;
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
  children,
  componentName,
  trackRender = true
}) => {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    if (trackRender) {
      renderStartTime.current = performance.now();
    }
  });

  useEffect(() => {
    if (trackRender && renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    }
  });

  return <>{children}</>;
};
