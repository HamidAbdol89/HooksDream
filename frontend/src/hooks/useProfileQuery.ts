import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, userApi } from '@/services/api';
import { User, Profile, Post, convertUserToProfile, mergeUserWithCloudinaryPriority, useAppStore } from '@/store/useAppStore';

// ⚡ Query Keys - organized và type-safe
export const profileKeys = {
  all: ['profiles'] as const,
  profile: (userId: string) => [...profileKeys.all, 'profile', userId] as const,
  posts: (userId: string) => [...profileKeys.all, 'posts', userId] as const,
  followers: (userId: string) => [...profileKeys.all, 'followers', userId] as const,
  following: (userId: string) => [...profileKeys.all, 'following', userId] as const,
};

// ⚡ Profile Query - instant loading với persistent caching
export const useProfileQuery = (userId: string, currentUserId?: string) => {
  const { updateUser } = useAppStore();
  const isOwnProfile = currentUserId === userId;

  return useQuery({
    queryKey: profileKeys.profile(userId),
    queryFn: async (): Promise<User> => {
      // ⚡ Check persistent cache first
      const persistCache = (window as any).persistCache;
      const cacheKey = `profile_${userId}`;
      const cached = persistCache?.get(cacheKey);
      
      if (cached) {
        // Update global state if own profile
        if (isOwnProfile) {
          updateUser(cached);
        }
        
        return cached;
      }
      
      const response = await userApi.getProfile(userId);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load profile');
      }

      const userData = mergeUserWithCloudinaryPriority(response.data);
      
      // ⚡ Save to persistent cache
      persistCache?.set(cacheKey, userData);
      
      // Update global state if own profile
      if (isOwnProfile) {
        updateUser(userData);
      }
      
      return userData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - profile data stays fresh longer
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !!userId, // Only run if userId exists
  });
};

// ⚡ Posts Query - parallel loading với profile
export const usePostsQuery = (userId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: [...profileKeys.posts(userId), page, limit],
    queryFn: async (): Promise<Post[]> => {
      // ⚡ Check persistent cache first
      const persistCache = (window as any).persistCache;
      const cacheKey = `posts_${userId}_${page}_${limit}`;
      const cached = persistCache?.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const response = await api.post.getUserPosts(userId, { page, limit });
      
      if (!response.success) {
        throw new Error('Failed to load posts');
      }
      
      const postsData = response.data || [];
      
      // ⚡ Save to persistent cache
      persistCache?.set(cacheKey, postsData);
      
      return postsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    enabled: !!userId,
  });
};

// ⚡ Combined Profile + Posts Query - ultimate performance
export const useProfileWithPosts = (userId: string, currentUserId?: string) => {
  const profileQuery = useProfileQuery(userId, currentUserId);
  const postsQuery = usePostsQuery(userId, 1, 10);

  // Derived data với memoization
  const mediaPosts = React.useMemo(() => {
    if (!postsQuery.data) return [];
    return postsQuery.data.filter((post: Post) => 
      (post.images && post.images.length > 0) || post.video
    );
  }, [postsQuery.data]);

  const repostPosts = React.useMemo(() => {
    if (!postsQuery.data) return [];
    return postsQuery.data.filter((post: Post) => post.repost_of);
  }, [postsQuery.data]);

  const profile = React.useMemo(() => {
    if (!profileQuery.data) return null;
    return convertUserToProfile(profileQuery.data);
  }, [profileQuery.data]);

  return {
    // Data
    user: profileQuery.data || null,
    profile,
    posts: postsQuery.data || [],
    mediaPosts,
    repostPosts,
    
    // Loading states
    loading: profileQuery.isLoading || postsQuery.isLoading,
    profileLoading: profileQuery.isLoading,
    postsLoading: postsQuery.isLoading,
    
    // Error states
    error: profileQuery.error?.message || postsQuery.error?.message || null,
    
    // Utilities
    isOwnProfile: currentUserId === userId,
    refetch: () => {
      profileQuery.refetch();
      postsQuery.refetch();
    },
  };
};

// ⚡ Profile Update Mutation - optimistic updates
export const useUpdateProfileMutation = (userId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: Partial<User>) => {
      const response = await userApi.updateProfile(userId, updateData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update profile');
      }
      
      return mergeUserWithCloudinaryPriority(response.data);
    },
    
    // ⚡ Optimistic updates - instant UI feedback
    onMutate: async (updateData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.profile(userId) });
      
      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(profileKeys.profile(userId));
      
      // Optimistically update
      queryClient.setQueryData(profileKeys.profile(userId), (old: User | undefined) => {
        if (!old) return old;
        return { ...old, ...updateData };
      });
      
      return { previousProfile };
    },
    
    // On success, update cache with server data
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.profile(userId), data);
      console.log('✅ Profile updated successfully');
    },
    
    // On error, rollback optimistic update
    onError: (err, updateData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.profile(userId), context.previousProfile);
      }
      console.error('❌ Profile update failed:', err);
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.profile(userId) });
    },
  });
};

// ⚡ Follow/Unfollow Mutation
export const useFollowMutation = (userId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle follow');
      }
      
      return response.json();
    },
    
    // Optimistic follow/unfollow
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileKeys.profile(userId) });
      
      const previousProfile = queryClient.getQueryData(profileKeys.profile(userId));
      
      queryClient.setQueryData(profileKeys.profile(userId), (old: User | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: !old.isFollowing,
          followerCount: old.isFollowing ? old.followerCount - 1 : old.followerCount + 1,
        };
      });
      
      return { previousProfile };
    },
    
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(profileKeys.profile(userId), (old: User | undefined) => {
          if (!old) return old;
          return {
            ...old,
            isFollowing: data.data.isFollowing,
            followerCount: data.data.followerCount,
          };
        });
      }
    },
    
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.profile(userId), context.previousProfile);
      }
    },
  });
};

// ⚡ Prefetch Profile - for smooth navigation
export const usePrefetchProfile = () => {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: profileKeys.profile(userId),
      queryFn: async () => {
        const response = await userApi.getProfile(userId);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load profile');
        }
        return mergeUserWithCloudinaryPriority(response.data);
      },
      staleTime: 10 * 60 * 1000,
    });
    
    // Also prefetch posts
    queryClient.prefetchQuery({
      queryKey: [...profileKeys.posts(userId), 1, 10],
      queryFn: async () => {
        const response = await api.post.getUserPosts(userId, { page: 1, limit: 10 });
        return response.success ? response.data || [] : [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};
