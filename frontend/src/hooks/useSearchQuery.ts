import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState, useEffect } from 'react';

// Types
interface SearchResult {
  _id: string;
  _type: 'user' | 'post';
  objectID: string;
  content?: string;
  userId?: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
  };
  username?: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  images?: string[];
  hashtags?: string[];
  createdAt?: string;
  type?: string;
  visibility?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    users: any[];
    posts: any[];
    total: number;
  };
}

interface SearchHistoryItem {
  query: string;
  lastSearched: string;
  searchCount: number;
  topResults?: {
    users: Array<{
      _id: string;
      username: string;
      displayName: string;
      avatar: string;
      isVerified: boolean;
    }>;
    posts: Array<{
      _id: string;
      content: string;
      likeCount?: number;
      commentCount?: number;
      repostCount?: number;
      userId: {
        _id: string;
        username: string;
        displayName: string;
        avatar: string;
      };
    }>;
  };
}

// API functions
const searchAPI = {
  search: async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}&limit=20`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      signal
    });
    
    if (!response.ok) throw new Error('Search failed');
    
    const data: SearchResponse = await response.json();
    
    if (!data.success) throw new Error('Search failed');
    
    // Transform API response to SearchResult[]
    const searchResults: SearchResult[] = [];
    
    // Add users
    data.data.users.forEach((user: any) => {
      searchResults.push({
        _id: user._id,
        _type: 'user',
        objectID: `user_${user._id}`,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified || false
      });
    });
    
    // Add posts
    data.data.posts.forEach((post: any) => {
      searchResults.push({
        _id: post._id,
        _type: 'post',
        objectID: `post_${post._id}`,
        content: post.content,
        userId: post.userId,
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        repostCount: post.repostCount || 0,
        images: post.images || [],
        hashtags: post.hashtags || [],
        createdAt: post.createdAt,
        type: post.type || 'text',
        visibility: post.visibility || 'public'
      });
    });
    
    return searchResults;
  },

  getTrendingHashtags: async (): Promise<string[]> => {
    const response = await fetch('http://localhost:5000/api/search/trending?limit=10');
    const data = await response.json();
    
    if (data.success) {
      return data.data.map((item: any) => item.hashtag);
    }
    return [];
  },

  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];

    const response = await fetch('http://localhost:5000/api/search/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.success ? data.data.searches : [];
  },

  deleteHistoryItem: async (query: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const response = await fetch(`http://localhost:5000/api/search/history/${encodeURIComponent(query)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete history item');
  },

  clearAllHistory: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/search/history', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to clear history');
  }
};

// Search hook with React Query
export const useSearchQuery = (query: string, enabled: boolean = true) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  return useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      return searchAPI.search(query, signal);
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// Trending hashtags hook
export const useTrendingHashtags = () => {
  return useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: searchAPI.getTrendingHashtags,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// Search history hook
export const useSearchHistory = () => {
  return useQuery({
    queryKey: ['search-history'],
    queryFn: searchAPI.getSearchHistory,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// Search history mutations
export const useSearchHistoryMutations = () => {
  const queryClient = useQueryClient();

  const deleteHistoryItem = useMutation({
    mutationFn: searchAPI.deleteHistoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    }
  });

  const clearAllHistory = useMutation({
    mutationFn: searchAPI.clearAllHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    }
  });

  return {
    deleteHistoryItem,
    clearAllHistory
  };
};

// Debounced search hook
export const useDebouncedSearch = (query: string, delay: number = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return debouncedQuery;
};
