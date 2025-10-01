// src/hooks/useArchivedPosts.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSocket } from './useSocket';
import { useEffect } from 'react';

interface ArchivedPost {
  _id: string;
  content: string;
  userId: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  archivedAt: string;
  expiresAt: string;
  likesCount: number;
  commentsCount: number;
  images?: string[];
}

interface ArchivedPostsResponse {
  success: boolean;
  data: ArchivedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useArchivedPosts = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Infinite query for archived posts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery<ArchivedPostsResponse>({
    queryKey: ['archivedPosts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.post.getArchivedPosts({ 
        page: pageParam as number, 
        limit: 10 
      }) as ArchivedPostsResponse;
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ArchivedPostsResponse) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Restore post mutation
  const restorePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await api.post.restorePost(postId);
    },
    onSuccess: (data, postId) => {
      // Remove post from archived list
      queryClient.setQueryData(['archivedPosts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: ArchivedPostsResponse) => ({
            ...page,
            data: page.data.filter((post: ArchivedPost) => post._id !== postId),
            pagination: {
              ...page.pagination,
              total: page.pagination.total - 1
            }
          }))
        };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('post:restored', { postId });
      }
    },
    onError: (error) => {
      console.error('Error restoring post:', error);
    }
  });

  // Archive post mutation (for when archiving from other components)
  const archivePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await api.post.archivePost(postId);
    },
    onSuccess: (data, postId) => {
      // Invalidate archived posts to refetch
      queryClient.invalidateQueries({ queryKey: ['archivedPosts'] });
      
      // Remove from main feed
      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((post: any) => post._id !== postId)
          }))
        };
      });

      // Emit socket event
      if (socket) {
        socket.emit('post:archived', { postId });
      }
    }
  });

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handlePostArchived = (data: { postId: string; post: ArchivedPost }) => {
      // Add to archived posts if it's current user's post
      queryClient.setQueryData(['archivedPosts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        const firstPage = oldData.pages[0];
        if (!firstPage) return oldData;

        return {
          ...oldData,
          pages: [
            {
              ...firstPage,
              data: [data.post, ...firstPage.data],
              pagination: {
                ...firstPage.pagination,
                total: firstPage.pagination.total + 1
              }
            },
            ...oldData.pages.slice(1)
          ]
        };
      });
    };

    const handlePostRestored = (data: { postId: string }) => {
      // Remove from archived posts
      queryClient.setQueryData(['archivedPosts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: ArchivedPostsResponse) => ({
            ...page,
            data: page.data.filter((post: ArchivedPost) => post._id !== data.postId),
            pagination: {
              ...page.pagination,
              total: page.pagination.total - 1
            }
          }))
        };
      });
    };

    const handlePostExpired = (data: { postId: string }) => {
      // Remove expired post from archived list
      queryClient.setQueryData(['archivedPosts'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: ArchivedPostsResponse) => ({
            ...page,
            data: page.data.filter((post: ArchivedPost) => post._id !== data.postId),
            pagination: {
              ...page.pagination,
              total: page.pagination.total - 1
            }
          }))
        };
      });
    };

    // Listen to socket events
    socket.on('post:archived', handlePostArchived);
    socket.on('post:restored', handlePostRestored);
    socket.on('post:expired', handlePostExpired);

    return () => {
      socket.off('post:archived', handlePostArchived);
      socket.off('post:restored', handlePostRestored);
      socket.off('post:expired', handlePostExpired);
    };
  }, [socket, queryClient]);

  // Flatten pages data
  const posts = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.pagination.total || 0;

  return {
    // Data
    posts,
    totalCount,
    
    // Loading states
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    
    // Pagination
    hasNextPage,
    fetchNextPage,
    
    // Actions
    restorePost: restorePostMutation.mutate,
    archivePost: archivePostMutation.mutate,
    isRestoring: restorePostMutation.isPending,
    isArchiving: archivePostMutation.isPending,
    
    // Refresh
    refetch
  };
};
