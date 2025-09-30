import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from './useProfileQuery';
import { userApi, api } from '@/services/api';
import { mergeUserWithCloudinaryPriority } from '@/store/useAppStore';

// ⚡ Smart Prefetching Strategy - Load profiles before user clicks
export const usePrefetchStrategy = () => {
  const queryClient = useQueryClient();

  // ⚡ Prefetch profile on hover/intersection
  const prefetchProfile = async (userId: string) => {
    // Check if already cached
    const cached = queryClient.getQueryData(profileKeys.profile(userId));
    if (cached) return;

    // Check persistent cache
    const persistCache = (window as any).persistCache;
    const cacheKey = `profile_${userId}`;
    const persistentCached = persistCache?.get(cacheKey);
    if (persistentCached) {
      // Populate React Query cache from persistent cache
      queryClient.setQueryData(profileKeys.profile(userId), persistentCached);
      return;
    }

    // Background prefetch
    queryClient.prefetchQuery({
      queryKey: profileKeys.profile(userId),
      queryFn: async () => {
        const response = await userApi.getProfile(userId);
        if (!response.success || !response.data) {
          throw new Error('Failed to prefetch profile');
        }
        
        const userData = mergeUserWithCloudinaryPriority(response.data);
        
        // Save to persistent cache
        persistCache?.set(cacheKey, userData);
        
        return userData;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  // ⚡ Prefetch posts for profile
  const prefetchPosts = async (userId: string) => {
    const postsKey = [...profileKeys.posts(userId), 1, 10];
    const cached = queryClient.getQueryData(postsKey);
    if (cached) return;

    // Check persistent cache
    const persistCache = (window as any).persistCache;
    const cacheKey = `posts_${userId}_1_10`;
    const persistentCached = persistCache?.get(cacheKey);
    if (persistentCached) {
      queryClient.setQueryData(postsKey, persistentCached);
      return;
    }

    queryClient.prefetchQuery({
      queryKey: postsKey,
      queryFn: async () => {
        const response = await api.post.getUserPosts(userId, { page: 1, limit: 10 });
        if (!response.success) {
          throw new Error('Failed to prefetch posts');
        }
        
        const postsData = response.data || [];
        
        // Save to persistent cache
        persistCache?.set(cacheKey, postsData);
        
        return postsData;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // ⚡ Smart prefetch - profile + posts together
  const prefetchUserData = async (userId: string) => {
    await Promise.all([
      prefetchProfile(userId),
      prefetchPosts(userId)
    ]);
  };

  // ⚡ Batch prefetch multiple users (for feeds, suggestions, etc.)
  const prefetchUsers = async (userIds: string[]) => {
    const promises = userIds.slice(0, 5).map(userId => prefetchProfile(userId)); // Limit to 5
    await Promise.all(promises);
  };

  return {
    prefetchProfile,
    prefetchPosts,
    prefetchUserData,
    prefetchUsers,
  };
};

// ⚡ Hook for hover-based prefetching
export const useHoverPrefetch = () => {
  const { prefetchUserData } = usePrefetchStrategy();
  
  const handleMouseEnter = (userId: string) => {
    // Debounce to avoid too many prefetches
    const timeoutId = setTimeout(() => {
      prefetchUserData(userId);
    }, 200); // 200ms delay
    
    return () => clearTimeout(timeoutId);
  };

  return { handleMouseEnter };
};

// ⚡ Hook for intersection-based prefetching (when user scrolls near)
export const useIntersectionPrefetch = () => {
  const { prefetchProfile } = usePrefetchStrategy();
  
  const observeElement = (element: HTMLElement, userId: string) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchProfile(userId);
            observer.unobserve(element); // Only prefetch once
          }
        });
      },
      { 
        rootMargin: '100px', // Start prefetching 100px before element is visible
        threshold: 0.1 
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  };

  return { observeElement };
};
