// hooks/useFeedQuery.ts - React Query for Feed with caching
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/services/api';
import { Post } from '@/types/post';

// Query keys for feed data
export const feedQueryKeys = {
  all: ['feed'] as const,
  posts: () => [...feedQueryKeys.all, 'posts'] as const,
  infinite: () => [...feedQueryKeys.posts(), 'infinite'] as const,
};

interface FeedResponse {
  success: boolean;
  data: Post[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Main feed hook with caching
export const useFeedQuery = () => {
  const queryClient = useQueryClient();

  // Infinite query for feed posts with caching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: feedQueryKeys.infinite(),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.post.getPosts({ page: pageParam, limit: 10 });
      return response as FeedResponse;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasNext ? (lastPage.pagination.page + 1) : undefined;
    },
    initialPageParam: 1,
    
    // 🚀 CACHING STRATEGY for Feed
    staleTime: 2 * 60 * 1000,    // 2 minutes - Fresh content but not too aggressive
    gcTime: 10 * 60 * 1000,      // 10 minutes - Keep in cache longer
    refetchOnWindowFocus: true,   // Refresh when user comes back
    refetchOnMount: true,         // Always fresh on mount
    refetchInterval: false,       // No auto-refresh (user-controlled)
  });

  // Flatten posts from all pages
  const posts = data?.pages.flatMap(page => page.data) ?? [];
  const totalPosts = posts.length;

  // Like post mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await api.post.likePost(postId);
    },
    onMutate: async (postId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: feedQueryKeys.infinite() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(feedQueryKeys.infinite());

      // Optimistically update
      queryClient.setQueryData(feedQueryKeys.infinite(), (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            data: page.data.map((post: Post) => 
              post._id === postId 
                ? { 
                    ...post, 
                    isLiked: !post.isLiked,
                    likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
                  }
                : post
            )
          }))
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(feedQueryKeys.infinite(), context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.infinite() });
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await api.post.deletePost(postId);
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKeys.infinite() });
      const previousData = queryClient.getQueryData(feedQueryKeys.infinite());

      // Remove post optimistically
      queryClient.setQueryData(feedQueryKeys.infinite(), (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            data: page.data.filter((post: Post) => post._id !== postId)
          }))
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(feedQueryKeys.infinite(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.infinite() });
    },
  });

  // Helper functions
  const likePost = useCallback((postId: string) => {
    likeMutation.mutate(postId);
  }, [likeMutation]);

  const deletePost = useCallback((postId: string) => {
    deleteMutation.mutate(postId);
  }, [deleteMutation]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Prefetch next page for better UX
  const prefetchNextPage = useCallback(() => {
    if (hasNextPage) {
      queryClient.prefetchInfiniteQuery({
        queryKey: feedQueryKeys.infinite(),
        queryFn: async ({ pageParam = 1 }) => {
          const response = await api.post.getPosts({ page: pageParam, limit: 10 });
          return response as FeedResponse;
        },
        initialPageParam: 1,
      });
    }
  }, [hasNextPage, queryClient]);

  return {
    // Data
    posts,
    totalPosts,
    
    // Loading states
    isLoading,
    isLoadingMore: isFetchingNextPage,
    isError,
    error,
    
    // Pagination
    hasMore: hasNextPage,
    loadMore,
    
    // Actions
    likePost,
    deletePost,
    refresh,
    prefetchNextPage,
    
    // Mutation states
    isLiking: likeMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook for invalidating feed cache (use after creating posts)
export const useFeedActions = () => {
  const queryClient = useQueryClient();

  const invalidateFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: feedQueryKeys.all });
  }, [queryClient]);

  const addNewPost = useCallback((newPost: Post) => {
    queryClient.setQueryData(feedQueryKeys.infinite(), (old: any) => {
      if (!old) return old;
      
      // Add new post to the beginning of first page
      const newPages = [...old.pages];
      if (newPages[0]) {
        newPages[0] = {
          ...newPages[0],
          data: [newPost, ...newPages[0].data]
        };
      }
      
      return {
        ...old,
        pages: newPages
      };
    });
  }, [queryClient]);

  return {
    invalidateFeed,
    addNewPost,
  };
};
