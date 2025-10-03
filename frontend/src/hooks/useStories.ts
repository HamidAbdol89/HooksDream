// useStories.ts - React Query hook for Story management with caching
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Story, CreateStoryData, StoryPosition, UseStoriesReturn } from '@/types/story';
import { useSocket } from '@/hooks/useSocket';

// API functions
const storyApi = {
  // Get active stories
  getActiveStories: async (params?: { 
    limit?: number; 
    centerX?: number; 
    centerY?: number; 
    radius?: number; 
  }): Promise<{ success: boolean; data: Story[]; count: number }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.centerX !== undefined) searchParams.append('centerX', params.centerX.toString());
    if (params?.centerY !== undefined) searchParams.append('centerY', params.centerY.toString());
    if (params?.radius) searchParams.append('radius', params.radius.toString());

    const response = await fetch(`/api/stories?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stories: ${response.statusText}`);
    }

    return response.json();
  },

  // Create story
  createStory: async (data: CreateStoryData): Promise<{ success: boolean; data: Story }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const formData = new FormData();
    
    if (data.content) formData.append('content', data.content);
    formData.append('mediaType', data.mediaType);
    if (data.media) formData.append('media', data.media);
    if (data.visualEffects) formData.append('visualEffects', JSON.stringify(data.visualEffects));
    if (data.settings) formData.append('settings', JSON.stringify(data.settings));
    if (data.position) formData.append('position', JSON.stringify(data.position));

    const response = await fetch('/api/stories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create story');
    }

    return response.json();
  },

  // View story
  viewStory: async (storyId: string, duration: number = 0): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration })
    });

    if (!response.ok) {
      throw new Error('Failed to view story');
    }

    return response.json();
  },

  // Add reaction
  addReaction: async (
    storyId: string, 
    type: string, 
    position: { x: number; y: number }
  ): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/reactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, position })
    });

    if (!response.ok) {
      throw new Error('Failed to add reaction');
    }

    return response.json();
  },

  // Reply to story
  replyToStory: async (storyId: string, message: string, media?: File): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const formData = new FormData();
    formData.append('message', message);
    if (media) formData.append('media', media);

    const response = await fetch(`/api/stories/${storyId}/replies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to send reply');
    }

    return response.json();
  },

  // Delete story
  deleteStory: async (storyId: string): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete story');
    }

    return response.json();
  },

  // Highlight story
  highlightStory: async (storyId: string, category: string): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/highlight`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category })
    });

    if (!response.ok) {
      throw new Error('Failed to highlight story');
    }

    return response.json();
  },

  // Update position
  updatePosition: async (storyId: string, position: StoryPosition): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/position`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ position })
    });

    if (!response.ok) {
      throw new Error('Failed to update position');
    }

    return response.json();
  }
};

export const useStories = (params?: { 
  limit?: number; 
  centerX?: number; 
  centerY?: number; 
  radius?: number; 
}): UseStoriesReturn => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Query key for caching
  const queryKey = ['stories', 'active', params];

  // Fetch stories with React Query
  const {
    data: storiesData,
    isLoading,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => storyApi.getActiveStories(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: true,
    retry: 2
  });

  const stories = storiesData?.data || [];

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: storyApi.createStory,
    onSuccess: (response) => {
      // Invalidate and refetch stories
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('story:created', response.data);
      }
      
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  // View story mutation
  const viewStoryMutation = useMutation({
    mutationFn: ({ storyId, duration }: { storyId: string; duration: number }) =>
      storyApi.viewStory(storyId, duration),
    onSuccess: (_, variables) => {
      // Update story in cache to mark as viewed
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === variables.storyId
              ? { ...story, hasViewed: true, viewCount: story.viewCount + 1 }
              : story
          )
        };
      });
    }
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({ storyId, type, position }: { 
      storyId: string; 
      type: string; 
      position: { x: number; y: number } 
    }) => storyApi.addReaction(storyId, type, position),
    onSuccess: (_, variables) => {
      // Update story in cache with new reaction
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === variables.storyId
              ? {
                  ...story,
                  reactions: [
                    ...story.reactions,
                    {
                      _id: `temp-${Date.now()}`,
                      userId: { _id: 'current-user', username: '', displayName: '', avatar: '' },
                      type: variables.type,
                      position: variables.position,
                      createdAt: new Date().toISOString()
                    }
                  ]
                }
              : story
          )
        };
      });
    }
  });

  // Reply to story mutation
  const replyToStoryMutation = useMutation({
    mutationFn: ({ storyId, message, media }: { 
      storyId: string; 
      message: string; 
      media?: File 
    }) => storyApi.replyToStory(storyId, message, media)
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: storyApi.deleteStory,
    onSuccess: (_, storyId) => {
      // Remove story from cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((story: Story) => story._id !== storyId)
        };
      });
      
      // Emit socket event
      if (socket) {
        socket.emit('story:deleted', { storyId });
      }
    }
  });

  // Highlight story mutation
  const highlightStoryMutation = useMutation({
    mutationFn: ({ storyId, category }: { storyId: string; category: string }) =>
      storyApi.highlightStory(storyId, category),
    onSuccess: (_, variables) => {
      // Update story in cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === variables.storyId
              ? { ...story, isHighlighted: true, highlightCategory: variables.category }
              : story
          )
        };
      });
    }
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: ({ storyId, position }: { storyId: string; position: StoryPosition }) =>
      storyApi.updatePosition(storyId, position),
    onSuccess: (_, variables) => {
      // Update story position in cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === variables.storyId
              ? { ...story, position: variables.position }
              : story
          )
        };
      });
    }
  });

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleStoryCreated = (data: { story: Story }) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    };

    const handleStoryDeleted = (data: { storyId: string }) => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((story: Story) => story._id !== data.storyId)
        };
      });
    };

    const handleStoryReaction = (data: { storyId: string; reaction: any }) => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === data.storyId
              ? { ...story, reactions: [...story.reactions, data.reaction] }
              : story
          )
        };
      });
    };

    const handlePositionUpdate = (data: { storyId: string; position: StoryPosition }) => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((story: Story) =>
            story._id === data.storyId
              ? { ...story, position: data.position }
              : story
          )
        };
      });
    };

    socket.on('story:created', handleStoryCreated);
    socket.on('story:deleted', handleStoryDeleted);
    socket.on('story:reaction', handleStoryReaction);
    socket.on('story:position_update', handlePositionUpdate);

    return () => {
      socket.off('story:created', handleStoryCreated);
      socket.off('story:deleted', handleStoryDeleted);
      socket.off('story:reaction', handleStoryReaction);
      socket.off('story:position_update', handlePositionUpdate);
    };
  }, [socket, queryClient, queryKey]);

  // Exported functions
  const createStory = useCallback(async (data: CreateStoryData) => {
    await createStoryMutation.mutateAsync(data);
  }, [createStoryMutation]);

  const viewStory = useCallback(async (storyId: string, duration: number = 0) => {
    await viewStoryMutation.mutateAsync({ storyId, duration });
  }, [viewStoryMutation]);

  const addReaction = useCallback(async (
    storyId: string, 
    type: string, 
    position: { x: number; y: number }
  ) => {
    await addReactionMutation.mutateAsync({ storyId, type, position });
  }, [addReactionMutation]);

  const replyToStory = useCallback(async (storyId: string, message: string, media?: File) => {
    await replyToStoryMutation.mutateAsync({ storyId, message, media });
  }, [replyToStoryMutation]);

  const deleteStory = useCallback(async (storyId: string) => {
    await deleteStoryMutation.mutateAsync(storyId);
  }, [deleteStoryMutation]);

  const highlightStory = useCallback(async (storyId: string, category: string) => {
    await highlightStoryMutation.mutateAsync({ storyId, category });
  }, [highlightStoryMutation]);

  const updatePosition = useCallback(async (storyId: string, position: StoryPosition) => {
    await updatePositionMutation.mutateAsync({ storyId, position });
  }, [updatePositionMutation]);

  const refreshStories = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    stories,
    isLoading,
    error,
    createStory,
    viewStory,
    addReaction,
    replyToStory,
    deleteStory,
    highlightStory,
    updatePosition,
    refreshStories
  };
};
