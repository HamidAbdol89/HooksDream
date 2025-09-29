import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Post } from '@/store/useAppStore';

interface UseRepostReturn {
  isReposting: boolean;
  repostPost: (postId: string, comment?: string) => Promise<Post | null>;
  error: string | null;
  clearError: () => void;
}

export const useRepost = (): UseRepostReturn => {
  const [isReposting, setIsReposting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repostPost = useCallback(async (postId: string, comment?: string): Promise<Post | null> => {
    if (isReposting) return null;

    try {
      setIsReposting(true);
      setError(null);

      const response = await api.post.repostPost(postId, comment);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to repost');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while reposting';
      setError(errorMessage);
      
      // Show user-friendly error messages
      if (errorMessage.includes('already reposted')) {
        setError('Bạn đã repost bài viết này rồi');
      } else if (errorMessage.includes('your own post')) {
        setError('Không thể repost bài viết của chính mình');
      } else if (errorMessage.includes('private post')) {
        setError('Không thể repost bài viết riêng tư');
      } else if (errorMessage.includes('not found')) {
        setError('Bài viết không tồn tại');
      } else {
        setError('Có lỗi xảy ra khi repost');
      }
      
      return null;
    } finally {
      setIsReposting(false);
    }
  }, [isReposting]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isReposting,
    repostPost,
    error,
    clearError
  };
};
