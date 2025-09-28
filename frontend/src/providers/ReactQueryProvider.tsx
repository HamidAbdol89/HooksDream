// src/providers/ReactQueryProvider.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // ✅ GIẢM XUỐNG 30s cho social app
      gcTime: 5 * 60 * 1000, // ✅ GIẢM XUỐNG 5 phút cache
      refetchOnWindowFocus: true, // Refetch khi tab active
      refetchOnReconnect: true, // Refetch khi reconnect internet
      refetchOnMount: true, // ✅ QUAN TRỌNG: Refetch khi component mount
      retry: 1, // ✅ GIẢM Retry xuống 1 lần
    },
    mutations: {
      retry: 1,
    },
  },
});

// ✅ EXPOSE queryClient globally for debugging/cache management
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
  
  // ✅ THÊM EVENT LISTENER ĐỂ REFETCH KHI CÓ SỰ KIỆN CUSTOM
  window.addEventListener('profile-updated', () => {
    // Invalidates all profile queries khi có update
    queryClient.invalidateQueries({ queryKey: ['social', 'profiles'] });
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