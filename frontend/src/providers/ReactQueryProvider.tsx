// src/providers/ReactQueryProvider.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ⚡ Persistent Cache với localStorage - survive browser refresh
const persistCache = {
  set: (key: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      localStorage.setItem(`rq_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  },
  
  get: (key: string) => {
    try {
      const cached = localStorage.getItem(`rq_cache_${key}`);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      if (Date.now() > cacheData.expires) {
        localStorage.removeItem(`rq_cache_${key}`);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  },
  
  clear: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rq_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
};

// ⚡ React Query với persistent caching cho tốc độ "như sấm chóp"
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer  
      refetchOnWindowFocus: false, // Không refetch khi focus window
      refetchOnReconnect: false, // Không refetch khi reconnect
      retry: 1, // Chỉ retry 1 lần để tránh delay
      refetchInterval: false, // Không auto refetch
    },
    mutations: {
      retry: 1,
    },
  },
});

// ✅ EXPOSE queryClient và persistCache globally
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
  (window as any).persistCache = persistCache;
  
  // ⚡ Event listener để invalidate cache khi cần
  window.addEventListener('profile-updated', () => {
    // Invalidates all profile queries khi có update
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    // Also clear persistent cache
    persistCache.clear();
  });
}

export const ReactQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};