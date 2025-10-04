// useStoryArchive.ts - Hook for archiving active stories
import { useMutation, useQueryClient } from '@tanstack/react-query';

const storyArchiveApi = {
  // Archive story manually
  archiveStory: async (storyId: string): Promise<{ success: boolean }> => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) throw new Error('No authentication token');

    const response = await fetch(`/api/stories/${storyId}/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to archive story');
    }

    return response.json();
  },
};

export const useStoryArchive = () => {
  const queryClient = useQueryClient();

  // Archive story mutation
  const archiveStoryMutation = useMutation({
    mutationFn: (storyId: string) => storyArchiveApi.archiveStory(storyId),
    onSuccess: (_, storyId) => {
      // Remove from active stories cache
      queryClient.setQueryData(['stories'], (oldData: any) => {
        if (!oldData?.data?.stories) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            stories: oldData.data.stories.filter((story: any) => story._id !== storyId)
          }
        };
      });

      // Invalidate archived stories to show newly archived story
      queryClient.invalidateQueries({ queryKey: ['archivedStories'] });
      
      // Invalidate active stories to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: (error) => {
      console.error('Archive story error:', error);
    }
  });

  const archiveStory = async (storyId: string) => {
    try {
      await archiveStoryMutation.mutateAsync(storyId);
      return { success: true };
    } catch (error) {
      console.error('Failed to archive story:', error);
      return { success: false, error };
    }
  };

  return {
    archiveStory,
    isArchiving: archiveStoryMutation.isPending,
  };
};
