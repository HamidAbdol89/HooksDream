// useArchivedStories.ts - Hook for archived stories management
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ArchivedStory {
  _id: string;
  userId: string;
  media: {
    type: 'image' | 'video' | 'audio' | 'text';
    url?: string;
    content?: string;
    duration?: number;
    thumbnail?: string;
  };
  settings: {
    visibility: 'public' | 'followers' | 'close_friends' | 'private';
  };
  createdAt: string;
  archivedAt: string;
  isArchived: boolean;
  views: Array<{ userId: string; viewedAt: string; duration?: number }>;
  reactions: Array<{ userId: string; type: string; position: { x: number; y: number } }>;
}

interface ArchivedStoriesResponse {
  success: boolean;
  message: string;
  data: {
    stories: ArchivedStory[];
    total: number;
  };
}

const storyApi = {
  // Get user's archived stories
  getArchivedStories: async (userId: string, limit = 50): Promise<ArchivedStoriesResponse> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/user/${userId}/archived?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch archived stories');
    }

    return response.json();
  },

  // Restore archived story
  restoreStory: async (storyId: string): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/restore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to restore story');
    }

    return response.json();
  },

  // Delete story permanently
  deleteStoryPermanently: async (storyId: string): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete story');
    }

    return response.json();
  },
};

export const useArchivedStories = (userId?: string) => {
  const queryClient = useQueryClient();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  // Query key for archived stories
  const queryKey = ['archivedStories', userId];

  // Fetch archived stories
  const {
    data: archivedStoriesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => storyApi.getArchivedStories(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
  });

  const archivedStories = archivedStoriesData?.data?.stories || [];

  // Restore story mutation
  const restoreStoryMutation = useMutation({
    mutationFn: (storyId: string) => storyApi.restoreStory(storyId),
    onSuccess: (_, storyId) => {
      // Remove from archived stories cache
      queryClient.setQueryData(queryKey, (oldData: ArchivedStoriesResponse | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            stories: oldData.data.stories.filter(story => story._id !== storyId),
            total: oldData.data.total - 1
          }
        };
      });

      // Invalidate active stories to show restored story
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: (error) => {
      console.error('Restore story error:', error);
    }
  });

  // Delete story permanently mutation
  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: string) => storyApi.deleteStoryPermanently(storyId),
    onSuccess: (_, storyId) => {
      // Remove from archived stories cache
      queryClient.setQueryData(queryKey, (oldData: ArchivedStoriesResponse | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            stories: oldData.data.stories.filter(story => story._id !== storyId),
            total: oldData.data.total - 1
          }
        };
      });
    },
    onError: (error) => {
      console.error('Delete story error:', error);
    }
  });

  // Story viewer functions
  const openStoryViewer = useCallback((index: number) => {
    setSelectedStoryIndex(index);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setSelectedStoryIndex(null);
  }, []);

  const navigateStory = useCallback((direction: 'next' | 'previous') => {
    if (selectedStoryIndex === null) return;

    if (direction === 'next' && selectedStoryIndex < archivedStories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else if (direction === 'previous' && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  }, [selectedStoryIndex, archivedStories.length]);

  // Action handlers
  const restoreStory = useCallback(async (storyId: string) => {
    await restoreStoryMutation.mutateAsync(storyId);
  }, [restoreStoryMutation]);

  const deleteStoryPermanently = useCallback(async (storyId: string) => {
    await deleteStoryMutation.mutateAsync(storyId);
  }, [deleteStoryMutation]);

  return {
    // Data
    archivedStories,
    isLoading,
    error,
    
    // Story viewer state
    selectedStoryIndex,
    selectedStory: selectedStoryIndex !== null ? archivedStories[selectedStoryIndex] : null,
    
    // Actions
    openStoryViewer,
    closeStoryViewer,
    navigateStory,
    restoreStory,
    deleteStoryPermanently,
    refetch,
    
    // Loading states
    isRestoring: restoreStoryMutation.isPending,
    isDeleting: deleteStoryMutation.isPending,
  };
};
