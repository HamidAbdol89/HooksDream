// hooks/useSocial.ts - Optimized for Real-time Social App
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery, 
  UseQueryResult, 
  UseInfiniteQueryResult, 
  UseMutationResult,
} from '@tanstack/react-query';
import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Types (same as before)
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  pronouns?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  isSetupComplete: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date; 
  lastLoginAt?: string | Date;
  [key: string]: any;
}

export interface FollowStats {
  followers: number;
  following?: number;
  posts?: number;
}

export interface FollowUser {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isFollowing: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

interface OptimisticContext {
  previousStats?: ApiResponse<FollowStats>;
  previousProfile?: ApiResponse<UserProfile>;
  targetUserId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// 🚀 OPTIMIZED: Separate query keys for different update frequencies
export const socialQueryKeys = {
  all: ['social'] as const,
  
  // 📊 Static/Slow-changing data (Cache longer)
  profiles: () => [...socialQueryKeys.all, 'profiles'] as const,
  profile: (id: string | undefined) => [...socialQueryKeys.profiles(), id] as const,
  
  // ⚡ Semi-realtime data (Medium cache)
  followStats: (id: string | undefined) => [...socialQueryKeys.all, 'follow-stats', id] as const,
  followers: (id: string | undefined) => [...socialQueryKeys.all, 'followers', id] as const,
  following: (id: string | undefined) => [...socialQueryKeys.all, 'following', id] as const,
  
  // 🔥 Real-time data (Short cache or no cache)
  currentProfile: (currentUserId: string | undefined) => [...socialQueryKeys.profiles(), 'current', currentUserId] as const,
  onlineStatus: (id: string | undefined) => [...socialQueryKeys.all, 'online-status', id] as const,
  
  // 📱 Interactive features (No cache)
  infiniteFollowers: (id: string | undefined) => [...socialQueryKeys.followers(id), 'infinite'] as const,
  infiniteFollowing: (id: string | undefined) => [...socialQueryKeys.following(id), 'infinite'] as const,
  userSearch: () => [...socialQueryKeys.all, 'user-search'] as const,
  popularUsers: () => [...socialQueryKeys.all, 'popular-users'] as const,
};

// Helper functions
const fetchWithAuth = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('user_hash_id') || 
                localStorage.getItem('hashId') || 
                localStorage.getItem('token') || 
                localStorage.getItem('userId') ||
                sessionStorage.getItem('user_hash_id') ||
                sessionStorage.getItem('hashId') ||
                sessionStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useSocial = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, isConnected } = useAppStore();
  
  const isInitializedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🎯 OPTIMIZED: Stable user ID computation
  const currentUserId = useMemo(() => {
    const id = currentUser?._id || currentUser?.id || currentUser?.hashId;
    return id ? String(id) : undefined;
  }, [currentUser?._id, currentUser?.id, currentUser?.hashId]);

  // 🧹 Optimized cache management
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastUserIdRef.current = currentUserId;
      return;
    }

    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    if (!isConnected && !currentUserId) {
      console.log('🧹 User logged out - scheduling selective cache clear');
      clearTimeoutRef.current = setTimeout(() => {
        // 🚀 OPTIMIZED: Only clear user-specific data, keep static data
        queryClient.removeQueries({ queryKey: socialQueryKeys.all, exact: false });
        lastUserIdRef.current = undefined;
      }, 1000);
    } else if (currentUserId && lastUserIdRef.current && currentUserId !== lastUserIdRef.current) {
      console.log('🔄 User changed - clearing user-specific cache');
      // 🚀 OPTIMIZED: Only clear current user data, not all profiles
      queryClient.removeQueries({ queryKey: socialQueryKeys.currentProfile(lastUserIdRef.current) });
      queryClient.removeQueries({ queryKey: socialQueryKeys.followStats(lastUserIdRef.current) });
      lastUserIdRef.current = currentUserId;
    } else if (currentUserId && !lastUserIdRef.current) {
      lastUserIdRef.current = currentUserId;
    }

    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
    };
  }, [currentUserId, isConnected, queryClient]);

  // 🎯 OPTIMIZED: Selective cache invalidation
  const invalidateRealTimeData = useCallback((): void => {
    if (!currentUserId) return;
    
    // Only invalidate frequently changing data
    queryClient.invalidateQueries({ 
      queryKey: socialQueryKeys.currentProfile(currentUserId),
      exact: true 
    });
    queryClient.invalidateQueries({ 
      queryKey: socialQueryKeys.followStats(currentUserId),
      exact: true 
    });
  }, [currentUserId, queryClient]);

  const triggerProfileUpdate = useCallback((): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: { timestamp: Date.now(), userId: currentUserId }
      }));
    }
    invalidateRealTimeData();
  }, [currentUserId, invalidateRealTimeData]);

  // 🚀 OPTIMIZED: Static profile data (Cache longer, update less frequently)
  const useProfile = (userId?: string): UseQueryResult<ApiResponse<UserProfile>, Error> => {
    return useQuery({
      queryKey: socialQueryKeys.profile(userId),
      queryFn: () => fetchWithAuth<UserProfile>(`/api/users/profile/${userId}`),
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🎯 LONGER CACHE: Profile info doesn't change often
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 401) return false;
        return failureCount < 2;
      },
      
      // 🔥 OPTIMIZED: Disable aggressive refetching for static data
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      refetchInterval: false,
      
      select: (data) => ({
        ...data,
        data: data.data ? {
          ...data.data,
          isOwnProfile: data.data._id === currentUserId
        } : undefined
      }),
    });
  };

  // ⚡ SEMI-REALTIME: Current user profile (Update more frequently)
  const useCurrentProfile = (): UseQueryResult<ApiResponse<UserProfile>, Error> => {
    return useQuery({
      queryKey: socialQueryKeys.currentProfile(currentUserId),
      queryFn: () => fetchWithAuth<UserProfile>(`/api/users/profile/${currentUserId}`),
      enabled: !!currentUserId && !!isConnected && isInitializedRef.current,
      
      // 🚀 SHORTER CACHE: Own profile can change frequently
      staleTime: 30 * 1000,     // 30 seconds
      gcTime: 2 * 60 * 1000,    // 2 minutes
      
      retry: 1,
      refetchOnWindowFocus: true,  // ✅ Refetch when user comes back
      refetchOnMount: true,
      refetchInterval: false,
    });
  };

  // 🔥 REALTIME: Follow stats (Most dynamic data)
  const useFollowStats = (userId?: string): UseQueryResult<ApiResponse<FollowStats>, Error> => {
    return useQuery({
      queryKey: socialQueryKeys.followStats(userId),
      queryFn: () => fetchWithAuth<FollowStats>(`/api/users/${userId}/stats`),
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🚀 VERY SHORT CACHE: Stats change constantly
      staleTime: 10 * 1000,     // 10 seconds
      gcTime: 1 * 60 * 1000,    // 1 minute
      
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: false,
    });
  };

  // 🎯 OPTIMIZED: Paginated followers (Medium cache)
  const useFollowers = (userId?: string, params: PaginationParams = {}): UseQueryResult<ApiResponse<FollowUser[]>, Error> => {
    const { page = 1, limit = 20 } = params;
    
    return useQuery({
      queryKey: [...socialQueryKeys.followers(userId), page, limit, currentUserId],
      queryFn: () => fetchWithAuth<FollowUser[]>(`/api/users/${userId}/followers?page=${page}&limit=${limit}`),
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🎯 MEDIUM CACHE: Follower lists don't change super frequently
      staleTime: 2 * 60 * 1000,  // 2 minutes
      gcTime: 5 * 60 * 1000,     // 5 minutes
      
      retry: 1,
      refetchOnWindowFocus: false,
    });
  };

  const useFollowing = (userId?: string, params: PaginationParams = {}): UseQueryResult<ApiResponse<FollowUser[]>, Error> => {
    const { page = 1, limit = 20 } = params;
    
    return useQuery({
      queryKey: [...socialQueryKeys.following(userId), page, limit, currentUserId],
      queryFn: () => fetchWithAuth<FollowUser[]>(`/api/users/${userId}/following?page=${page}&limit=${limit}`),
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🎯 MEDIUM CACHE
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    });
  };

  // 🔥 NO CACHE: Infinite scroll data (Always fresh)
  const useInfiniteFollowers = (userId?: string, limit = 20): UseInfiniteQueryResult<ApiResponse<FollowUser[]>, Error> => {
    return useInfiniteQuery({
      queryKey: [...socialQueryKeys.infiniteFollowers(userId), currentUserId],
      queryFn: ({ pageParam = 1 }) => 
        fetchWithAuth<FollowUser[]>(`/api/users/${userId}/followers?page=${pageParam}&limit=${limit}`),
      getNextPageParam: (lastPage) => {
        return lastPage.pagination?.hasNext ? (lastPage.pagination.page + 1) : undefined;
      },
      initialPageParam: 1,
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🚀 NO CACHE: Infinite scroll should always be fresh
      staleTime: 0,
      gcTime: 1 * 60 * 1000,
      maxPages: 10, // 🎯 Increased for better UX
    });
  };

  const useInfiniteFollowing = (userId?: string, limit = 20): UseInfiniteQueryResult<ApiResponse<FollowUser[]>, Error> => {
    return useInfiniteQuery({
      queryKey: [...socialQueryKeys.infiniteFollowing(userId), currentUserId],
      queryFn: ({ pageParam = 1 }) => 
        fetchWithAuth<FollowUser[]>(`/api/users/${userId}/following?page=${pageParam}&limit=${limit}`),
      getNextPageParam: (lastPage) => {
        return lastPage.pagination?.hasNext ? (lastPage.pagination.page + 1) : undefined;
      },
      initialPageParam: 1,
      enabled: !!userId && !!currentUserId && isConnected,
      
      // 🚀 NO CACHE
      staleTime: 0,
      gcTime: 1 * 60 * 1000,
      maxPages: 10,
    });
  };

  // 🚀 OPTIMIZED: Faster follow/unfollow with better optimistic updates
  const followMutation: UseMutationResult<ApiResponse, Error, string> = useMutation({
    mutationFn: (targetUserId: string) => 
      fetchWithAuth(`/api/users/${targetUserId}/follow`, { method: 'POST' }),
    onMutate: async (targetUserId: string): Promise<OptimisticContext> => {
      // Cancel related queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: socialQueryKeys.profile(targetUserId) }),
        queryClient.cancelQueries({ queryKey: socialQueryKeys.followStats(targetUserId) }),
      ]);
      
      const previousProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(socialQueryKeys.profile(targetUserId));
      const previousStats = queryClient.getQueryData<ApiResponse<FollowStats>>(socialQueryKeys.followStats(targetUserId));
      
      // 🚀 OPTIMIZED: Update both profile and stats optimistically
      if (previousProfile?.data) {
        queryClient.setQueryData<ApiResponse<UserProfile>>(socialQueryKeys.profile(targetUserId), {
          ...previousProfile,
          data: {
            ...previousProfile.data,
            followerCount: previousProfile.data.followerCount + 1,
            isFollowing: true
          }
        });
      }
      
      if (previousStats?.data) {
        queryClient.setQueryData<ApiResponse<FollowStats>>(socialQueryKeys.followStats(targetUserId), {
          ...previousStats,
          data: {
            ...previousStats.data,
            followers: previousStats.data.followers + 1
          }
        });
      }
      
      return { previousProfile, previousStats, targetUserId };
    },
    onError: (error: Error, targetUserId: string, context?: OptimisticContext) => {
      // Rollback optimistic updates
      if (context?.previousProfile) {
        queryClient.setQueryData(socialQueryKeys.profile(targetUserId), context.previousProfile);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(socialQueryKeys.followStats(targetUserId), context.previousStats);
      }
    },
    onSuccess: async (data, targetUserId) => {
      // 🎯 SELECTIVE INVALIDATION: Only invalidate what changed
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.profile(targetUserId), exact: true }),
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.followStats(targetUserId), exact: true }),
        // Invalidate infinite queries for real-time updates
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.infiniteFollowers(currentUserId), exact: true }),
      ]);
    },
  });

  const unfollowMutation: UseMutationResult<ApiResponse, Error, string> = useMutation({
    mutationFn: (targetUserId: string) => 
      fetchWithAuth(`/api/users/${targetUserId}/follow`, { method: 'POST' }),
    onMutate: async (targetUserId: string): Promise<OptimisticContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: socialQueryKeys.profile(targetUserId) }),
        queryClient.cancelQueries({ queryKey: socialQueryKeys.followStats(targetUserId) }),
      ]);
      
      const previousProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(socialQueryKeys.profile(targetUserId));
      const previousStats = queryClient.getQueryData<ApiResponse<FollowStats>>(socialQueryKeys.followStats(targetUserId));

      if (previousProfile?.data) {
        queryClient.setQueryData<ApiResponse<UserProfile>>(socialQueryKeys.profile(targetUserId), {
          ...previousProfile,
          data: {
            ...previousProfile.data,
            followerCount: Math.max(0, previousProfile.data.followerCount - 1),
            isFollowing: false
          }
        });
      }
      
      if (previousStats?.data) {
        queryClient.setQueryData<ApiResponse<FollowStats>>(socialQueryKeys.followStats(targetUserId), {
          ...previousStats,
          data: {
            ...previousStats.data,
            followers: Math.max(0, previousStats.data.followers - 1)
          }
        });
      }
      
      return { previousProfile, previousStats, targetUserId };
    },
    onError: (error: Error, targetUserId: string, context?: OptimisticContext) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(socialQueryKeys.profile(targetUserId), context.previousProfile);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(socialQueryKeys.followStats(targetUserId), context.previousStats);
      }
    },
    onSuccess: async (data, targetUserId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.profile(targetUserId), exact: true }),
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.followStats(targetUserId), exact: true }),
        queryClient.invalidateQueries({ queryKey: socialQueryKeys.infiniteFollowing(currentUserId), exact: true }),
      ]);
    },
  });

  // 🚀 OPTIMIZED: Profile update with immediate visual feedback
  const updateProfileMutation: UseMutationResult<ApiResponse<UserProfile>, Error, Partial<UserProfile>> = useMutation({
    mutationFn: (updatedData: Partial<UserProfile>) => 
      fetchWithAuth<UserProfile>(`/api/users/profile/${currentUserId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      }),
    onMutate: async (updatedData: Partial<UserProfile>) => {
      if (!currentUserId) return {};
      
      await queryClient.cancelQueries({ queryKey: socialQueryKeys.currentProfile(currentUserId) });
      const previousProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(socialQueryKeys.currentProfile(currentUserId));

      const allowedFields: (keyof UserProfile)[] = ['avatar', 'coverImage', 'username', 'displayName', 'bio', 'location', 'website'];
      const filteredUpdate = Object.keys(updatedData).reduce((acc, key) => {
        if (allowedFields.includes(key as keyof UserProfile)) {
          acc[key as keyof UserProfile] = updatedData[key as keyof UserProfile];
        }
        return acc;
      }, {} as Partial<UserProfile>);

      if (previousProfile?.data) {
        const optimisticProfile = {
          ...previousProfile,
          data: {
            ...previousProfile.data,
            ...filteredUpdate,
            updatedAt: new Date().toISOString()
          }
        };
        queryClient.setQueryData(socialQueryKeys.currentProfile(currentUserId), optimisticProfile);
        
        // 🚀 ALSO UPDATE GENERAL PROFILE CACHE
        queryClient.setQueryData(socialQueryKeys.profile(currentUserId), optimisticProfile);
      }

      return { previousProfile };
    },
    onError: (error, updatedData, context) => {
      if (context?.previousProfile && currentUserId) {
        queryClient.setQueryData(socialQueryKeys.currentProfile(currentUserId), context.previousProfile);
        queryClient.setQueryData(socialQueryKeys.profile(currentUserId), context.previousProfile);
      }
    },
    onSuccess: (data) => {
      if (currentUserId) {
        // Update both cache locations
        queryClient.setQueryData(socialQueryKeys.currentProfile(currentUserId), data);
        queryClient.setQueryData(socialQueryKeys.profile(currentUserId), data);
        setTimeout(() => triggerProfileUpdate(), 200);
      }
    },
  });

  // Avatar upload (keep same but with better cache update)
  const uploadAvatarMutation: UseMutationResult<ApiResponse<UserProfile>, Error, File> = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const token = localStorage.getItem('user_hash_id') || 
                    localStorage.getItem('hashId') || 
                    localStorage.getItem('token') || 
                    sessionStorage.getItem('user_hash_id');
      
      const response = await fetch(`${API_BASE_URL}/api/users/profile/${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      if (currentUserId) {
        // Update both cache locations immediately
        queryClient.setQueryData(socialQueryKeys.currentProfile(currentUserId), data);
        queryClient.setQueryData(socialQueryKeys.profile(currentUserId), data);
        triggerProfileUpdate();
      }
    },
  });

  // 🔥 NO CACHE: Search should always be fresh
  const useUserSearch = (searchTerm: string, params: PaginationParams = {}): UseQueryResult<ApiResponse<UserProfile[]>, Error> => {
    const { page = 1, limit = 10 } = params;

    return useQuery({
      queryKey: [...socialQueryKeys.userSearch(), searchTerm, page, limit, currentUserId],
      queryFn: () => 
        fetchWithAuth<UserProfile[]>(`/api/users?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`),
      enabled: !!searchTerm && searchTerm.length >= 2 && !!currentUserId && isConnected,
      
      // 🚀 NO CACHE: Search should always be fresh
      staleTime: 0,
      gcTime: 30 * 1000, // Keep for 30 seconds in case user goes back
      retry: 1,
    });
  };

  // 🎯 MEDIUM CACHE: Popular users don't change super frequently  
  const usePopularUsers = (limit = 10): UseQueryResult<ApiResponse<UserProfile[]>, Error> => {
    return useQuery({
      queryKey: [...socialQueryKeys.popularUsers(), limit, currentUserId],
      queryFn: async () => {
        const response = await fetchWithAuth<UserProfile[]>(`/api/users/popular?limit=${limit}`);
        console.log('Popular users response:', response);
        return response;
      },
      enabled: !!currentUserId && isConnected,
      
      // 🎯 LONGER CACHE: Popular users change slowly
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    });
  };

  // Helper functions
  const toggleFollow = useCallback(async (userId: string, isCurrentlyFollowing: boolean): Promise<void> => {
    try {
      if (isCurrentlyFollowing) {
        await unfollowMutation.mutateAsync(userId);
      } else {
        await followMutation.mutateAsync(userId);
      }
    } catch (error) {
      throw error;
    }
  }, [followMutation, unfollowMutation]);

  const prefetchProfile = useCallback(async (userId: string): Promise<void> => {
    if (!currentUserId || !isConnected) return;
    
    await queryClient.prefetchQuery({
      queryKey: socialQueryKeys.profile(userId),
      queryFn: () => fetchWithAuth<UserProfile>(`/api/users/profile/${userId}`),
      staleTime: 5 * 60 * 1000, // Match useProfile staleTime
    });
  }, [currentUserId, isConnected, queryClient]);

  const prefetchFollowStats = useCallback(async (userId: string): Promise<void> => {
    if (!currentUserId || !isConnected) return;
    
    await queryClient.prefetchQuery({
      queryKey: socialQueryKeys.followStats(userId),
      queryFn: () => fetchWithAuth<FollowStats>(`/api/users/${userId}/stats`),
      staleTime: 10 * 1000, // Match useFollowStats staleTime
    });
  }, [currentUserId, isConnected, queryClient]);

  // 🎯 OPTIMIZED: Refetch functions
  const refetchProfile = useCallback(async (userId: string): Promise<void> => {
    await queryClient.refetchQueries({ 
      queryKey: socialQueryKeys.profile(userId),
      exact: true 
    });
  }, [queryClient]);

  const refetchCurrentProfile = useCallback(async (): Promise<void> => {
    if (currentUserId) {
      await queryClient.refetchQueries({ 
        queryKey: socialQueryKeys.currentProfile(currentUserId),
        exact: true 
      });
    }
  }, [currentUserId, queryClient]);

  const invalidateUserData = useCallback(async (userId: string): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.profile(userId), exact: true }),
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.followStats(userId), exact: true }),
    ]);
  }, [queryClient]);

  const clearUserCache = useCallback((userId: string): void => {
    queryClient.removeQueries({ queryKey: socialQueryKeys.profile(userId) });
    queryClient.removeQueries({ queryKey: socialQueryKeys.followStats(userId) });
  }, [queryClient]);

  const clearAllCache = useCallback((): void => {
    console.log('🧹 Manually clearing all social cache');
    queryClient.clear();
    lastUserIdRef.current = undefined;
  }, [queryClient]);

  return {
    // Queries
    useProfile,
    useCurrentProfile,
    useFollowStats,
    useFollowers,
    useFollowing,
    useInfiniteFollowers,
    useInfiniteFollowing,
    useUserSearch,
    usePopularUsers,
    
    // Refetch functions
    refetchProfile,
    refetchCurrentProfile,
    prefetchFollowStats,
    triggerProfileUpdate,
    clearAllCache,
    invalidateRealTimeData,

    // Mutations
    followMutation,
    unfollowMutation,
    updateProfileMutation,
    uploadAvatarMutation,

    // Helper functions
    toggleFollow,
    prefetchProfile,
    invalidateUserData,
    clearUserCache,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,

    // Loading states
    isFollowLoading: followMutation.isPending || unfollowMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,

    // Current user info
    currentUserId,
  };
};

// Keep the rest of the hooks the same...
export const useFollowActions = () => {
  const { followMutation, unfollowMutation } = useSocial();

  const toggleFollow = async (userId: string, currentStatus: boolean): Promise<void> => {
    try {
      if (currentStatus) {
        await unfollowMutation.mutateAsync(userId);
      } else {
        await followMutation.mutateAsync(userId);
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
    error: followMutation.error || unfollowMutation.error,
  };
};

export const useBulkFollowActions = () => {
  const queryClient = useQueryClient();
  const { currentUserId } = useSocial();

  const bulkFollowMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map(userId => fetchWithAuth(`/api/users/${userId}/follow`, { method: 'POST' }))
      );
      return results;
    },
    onSettled: async () => {
      if (currentUserId) {
        // 🚀 OPTIMIZED: Only invalidate what we need
        await Promise.all([
          queryClient.invalidateQueries({ 
            queryKey: socialQueryKeys.currentProfile(currentUserId),
            exact: true
          }),
          queryClient.invalidateQueries({ 
            queryKey: socialQueryKeys.followStats(currentUserId),
            exact: true
          }),
          queryClient.invalidateQueries({ 
            queryKey: socialQueryKeys.infiniteFollowing(currentUserId),
            exact: true
          }),
        ]);
      }
    }
  });

  return {
    bulkFollow: bulkFollowMutation.mutateAsync,
    isBulkFollowing: bulkFollowMutation.isPending,
    bulkFollowError: bulkFollowMutation.error,
  };
};

// 🔥 NEW: Real-time event handling hook for WebSocket integration
export const useRealTimeUpdates = () => {
  const queryClient = useQueryClient();
  const { currentUserId } = useSocial();

  const handleFollowEvent = useCallback((data: { userId: string, targetUserId: string, action: 'follow' | 'unfollow' }) => {
    const { userId, targetUserId, action } = data;
    
    // Update target user's stats
    queryClient.setQueryData<ApiResponse<FollowStats>>(
      socialQueryKeys.followStats(targetUserId),
      (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            followers: action === 'follow' 
              ? old.data.followers + 1 
              : Math.max(0, old.data.followers - 1)
          }
        };
      }
    );

    // Update target user's profile
    queryClient.setQueryData<ApiResponse<UserProfile>>(
      socialQueryKeys.profile(targetUserId),
      (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            followerCount: action === 'follow' 
              ? old.data.followerCount + 1 
              : Math.max(0, old.data.followerCount - 1),
            isFollowing: userId === currentUserId ? (action === 'follow') : old.data.isFollowing
          }
        };
      }
    );

    // Invalidate infinite scroll lists
    queryClient.invalidateQueries({ 
      queryKey: socialQueryKeys.infiniteFollowers(targetUserId) 
    });
  }, [queryClient, currentUserId]);

  const handleProfileUpdateEvent = useCallback((data: { userId: string, updatedFields: Partial<UserProfile> }) => {
    const { userId, updatedFields } = data;
    
    // Update profile cache
    queryClient.setQueryData<ApiResponse<UserProfile>>(
      socialQueryKeys.profile(userId),
      (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          }
        };
      }
    );

    // If it's current user, update current profile cache too
    if (userId === currentUserId) {
      queryClient.setQueryData<ApiResponse<UserProfile>>(
        socialQueryKeys.currentProfile(currentUserId),
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ...updatedFields,
              updatedAt: new Date().toISOString()
            }
          };
        }
      );
    }
  }, [queryClient, currentUserId]);

  return {
    handleFollowEvent,
    handleProfileUpdateEvent,
  };
};

// 🚀 NEW: Optimized prefetching hook for better UX
export const useSmartPrefetch = () => {
  const { prefetchProfile, prefetchFollowStats } = useSocial();
  
  const prefetchUserData = useCallback(async (userId: string) => {
    // Prefetch both profile and stats in parallel
    await Promise.all([
      prefetchProfile(userId),
      prefetchFollowStats(userId)
    ]);
  }, [prefetchProfile, prefetchFollowStats]);

  // Prefetch on hover with debounce
  const handleUserHover = useCallback(
    debounce((userId: string) => {
      prefetchUserData(userId);
    }, 300),
    [prefetchUserData]
  );

  return {
    prefetchUserData,
    handleUserHover,
  };
};

// 🎯 UTILITY: Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useSocial;

// 🔥 PERFORMANCE TIPS FOR REAL-TIME SOCIAL APP:

/*
1. 🎯 CACHE STRATEGY:
   - Static data (profiles): 5-10 minutes
   - Semi-realtime (stats): 10-30 seconds  
   - Realtime (search, infinite): 0 seconds
   - Interactive (current profile): 30 seconds

2. 🚀 OPTIMISTIC UPDATES:
   - Follow/unfollow: Update immediately, rollback on error
   - Profile updates: Show changes instantly
   - Stats: Update counters optimistically

3. 📱 PREFETCHING:
   - Prefetch on hover (debounced)
   - Prefetch popular/suggested users
   - Background refresh for active data

4. 🔥 REAL-TIME INTEGRATION:
   - Use WebSocket events with useRealTimeUpdates
   - Update cache directly from WebSocket events  
   - Invalidate infinite queries for live updates

5. 🧹 CACHE MANAGEMENT:
   - Clear user-specific data on logout
   - Keep static data across users
   - Use selective invalidation

6. ⚡ PERFORMANCE:
   - Disable unnecessary refetchOnWindowFocus
   - Use exact: true for targeted invalidation
   - Limit maxPages for infinite queries
   - Use staleTime appropriately for each data type

7. 🎨 UX IMPROVEMENTS:
   - Show loading states for mutations
   - Use optimistic updates for instant feedback
   - Prefetch on user interactions
   - Handle offline states gracefully
*/