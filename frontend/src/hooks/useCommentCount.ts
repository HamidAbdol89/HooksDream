// src/hooks/useCommentCount.ts - Fixed Version
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export const useCommentCount = (postId: string, initialCount?: number) => {
  const [commentCount, setCommentCount] = useState(initialCount || 0);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default
  const [error, setError] = useState<string | null>(null);

  // Fallback method - đếm thủ công (method chính)
  const fetchCommentCountFallback = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let totalCount = 0;
      let currentPage = 1;
      let hasMore = true;
      
      // Đếm tất cả comments + replies
      while (hasMore) {
        const response = await api.comments.getComments(postId, {
          page: currentPage,
          limit: 50
        });
        
        if (response.success && Array.isArray(response.data)) {
          // Đếm comments chính
          totalCount += response.data.length;
          
          // Đếm replies của từng comment
          for (const comment of response.data) {
            if (comment.replyCount && comment.replyCount > 0) {
              totalCount += comment.replyCount;
            }
          }
          
          hasMore = response.data.length === 50;
          currentPage++;
        } else {
          hasMore = false;
        }
        
        // Tránh infinite loop
        if (currentPage > 20) break;
      }
      
      setCommentCount(totalCount);
      
    } catch (error) {
      console.warn('Error counting comments manually:', error);
      setCommentCount(initialCount || 0);
    } finally {
      setIsLoading(false);
    }
  }, [postId, initialCount]);

  // Fetch comment count với fallback strategy
  const fetchCommentCount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try endpoint mới (optional, có thể fail)
      try {
        const response = await fetch(`/api/posts/${postId}/comment-count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && typeof data.data?.count === 'number') {
            setCommentCount(data.data.count);
            setIsLoading(false);
            return; // Success, exit early
          }
        }
      } catch (networkError) {
        // Endpoint failed, will fallback to manual count
        console.info('Comment count endpoint unavailable, using manual count');
      }
      
      // Fallback: đếm manual
      await fetchCommentCountFallback();
      
    } catch (error) {
      console.error('Error fetching comment count:', error);
      setError('Failed to fetch comment count');
      setCommentCount(initialCount || 0);
      setIsLoading(false);
    }
  }, [postId, initialCount, fetchCommentCountFallback]);

  // Debounced refetch để tránh spam requests
  const debouncedRefetch = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchCommentCount();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [fetchCommentCount]);

  // Initial fetch
  useEffect(() => {
    if (postId) {
      // Use fallback method by default for faster loading
      fetchCommentCountFallback();
    }
  }, [postId, fetchCommentCountFallback]);

  // Event listeners for real-time updates
  useEffect(() => {
    const handleCommentCreated = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        setCommentCount(prev => prev + 1);
        const cleanup = debouncedRefetch();
        return cleanup;
      }
    };

    const handleCommentDeleted = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        setCommentCount(prev => Math.max(0, prev - 1));
        const cleanup = debouncedRefetch();
        return cleanup;
      }
    };

    const handleReplyCreated = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        setCommentCount(prev => prev + 1);
        const cleanup = debouncedRefetch();
        return cleanup;
      }
    };

    const handleReplyDeleted = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        setCommentCount(prev => Math.max(0, prev - 1));
        const cleanup = debouncedRefetch();
        return cleanup;
      }
    };

    const handleForceRefresh = (event: CustomEvent) => {
      if (event.detail?.postId === postId) {
        fetchCommentCount();
      }
    };

    // Event listeners
    window.addEventListener('commentCreated', handleCommentCreated as EventListener);
    window.addEventListener('commentDeleted', handleCommentDeleted as EventListener);
    window.addEventListener('replyCreated', handleReplyCreated as EventListener);
    window.addEventListener('replyDeleted', handleReplyDeleted as EventListener);
    window.addEventListener('refreshCommentCount', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('commentCreated', handleCommentCreated as EventListener);
      window.removeEventListener('commentDeleted', handleCommentDeleted as EventListener);
      window.removeEventListener('replyCreated', handleReplyCreated as EventListener);
      window.removeEventListener('replyDeleted', handleReplyDeleted as EventListener);
      window.removeEventListener('refreshCommentCount', handleForceRefresh as EventListener);
    };
  }, [postId, debouncedRefetch, fetchCommentCount]);

  return { 
    commentCount, 
    isLoading, 
    error,
    refetch: fetchCommentCount,
    // Utility để force refresh từ bên ngoài
    forceRefresh: useCallback(() => {
      window.dispatchEvent(new CustomEvent('refreshCommentCount', {
        detail: { postId }
      }));
    }, [postId])
  };
};